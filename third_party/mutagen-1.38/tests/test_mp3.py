# -*- coding: utf-8 -*-

import os

from tests import TestCase, DATA_DIR, get_temp_copy
from mutagen._compat import cBytesIO, text_type, xrange
from mutagen.mp3 import MP3, error as MP3Error, delete, MPEGInfo, EasyMP3, \
    BitrateMode, iter_sync
from mutagen.mp3._util import XingHeader, XingHeaderError, VBRIHeader, \
    VBRIHeaderError, LAMEHeader, LAMEError
from mutagen.id3 import ID3


class TMP3Util(TestCase):

    def test_find_sync(self):

        def get_syncs(fileobj, max_read):
            start = fileobj.tell()
            pos = []
            for i in iter_sync(fileobj, max_read):
                pos.append(fileobj.tell() - start)
            return pos

        self.assertEqual(get_syncs(cBytesIO(b"abc"), 100), [])
        self.assertEqual(get_syncs(cBytesIO(b""), 100), [])
        self.assertEqual(get_syncs(cBytesIO(b"a\xff\xe0"), 1), [])

        self.assertEqual(get_syncs(cBytesIO(b"a\xff\xc0\xff\xe0"), 100), [3])
        self.assertEqual(
            get_syncs(cBytesIO(b"a\xff\xe0\xff\xe0\xff\xe0"), 100), [1, 3, 5])

        for i in xrange(400):
            fileobj = cBytesIO(b"\x00" * i + b"\xff\xe0")
            self.assertEqual(get_syncs(fileobj, 100 + i), [i])


class TMP3(TestCase):
    silence = os.path.join(DATA_DIR, 'silence-44-s.mp3')
    silence_nov2 = os.path.join(DATA_DIR, 'silence-44-s-v1.mp3')
    silence_mpeg2 = os.path.join(DATA_DIR, 'silence-44-s-mpeg2.mp3')
    silence_mpeg25 = os.path.join(DATA_DIR, 'silence-44-s-mpeg25.mp3')
    lame = os.path.join(DATA_DIR, 'lame.mp3')
    lame_peak = os.path.join(DATA_DIR, 'lame-peak.mp3')
    lame_broken_short = os.path.join(DATA_DIR, 'lame397v9short.mp3')

    def setUp(self):
        self.filename = get_temp_copy(
            os.path.join(DATA_DIR, "silence-44-s.mp3"))

        self.mp3 = MP3(self.filename)
        self.mp3_2 = MP3(self.silence_nov2)
        self.mp3_3 = MP3(self.silence_mpeg2)
        self.mp3_4 = MP3(self.silence_mpeg25)
        self.mp3_lame = MP3(self.lame)
        self.mp3_lame_peak = MP3(self.lame_peak)

    def test_lame_broken_short(self):
        # lame <=3.97 wrote broken files
        f = MP3(self.lame_broken_short)
        assert f.info.encoder_info == "LAME 3.97.0"
        assert f.info.encoder_settings == "-V 9"
        assert f.info.length == 0.0
        assert f.info.bitrate == 64000
        assert f.info.bitrate_mode == 2
        assert f.info.sample_rate == 24000

    def test_mode(self):
        from mutagen.mp3 import JOINTSTEREO
        self.failUnlessEqual(self.mp3.info.mode, JOINTSTEREO)
        self.failUnlessEqual(self.mp3_2.info.mode, JOINTSTEREO)
        self.failUnlessEqual(self.mp3_3.info.mode, JOINTSTEREO)
        self.failUnlessEqual(self.mp3_4.info.mode, JOINTSTEREO)

    def test_replaygain(self):
        self.assertEqual(self.mp3_3.info.track_gain, 51.0)
        self.assertEqual(self.mp3_4.info.track_gain, 51.0)
        self.assertEqual(self.mp3_lame.info.track_gain, 6.0)
        self.assertAlmostEqual(self.mp3_lame_peak.info.track_gain, 6.8, 1)
        self.assertAlmostEqual(self.mp3_lame_peak.info.track_peak, 0.21856, 4)

        self.assertTrue(self.mp3.info.track_gain is None)
        self.assertTrue(self.mp3.info.track_peak is None)
        self.assertTrue(self.mp3.info.album_gain is None)

    def test_channels(self):
        self.assertEqual(self.mp3.info.channels, 2)
        self.assertEqual(self.mp3_2.info.channels, 2)
        self.assertEqual(self.mp3_3.info.channels, 2)
        self.assertEqual(self.mp3_4.info.channels, 2)

    def test_encoder_info(self):
        self.assertEqual(self.mp3.info.encoder_info, u"")
        self.assertTrue(isinstance(self.mp3.info.encoder_info, text_type))
        self.assertEqual(self.mp3_2.info.encoder_info, u"")
        self.assertEqual(self.mp3_3.info.encoder_info, u"LAME 3.98.1+")
        self.assertEqual(self.mp3_4.info.encoder_info, u"LAME 3.98.1+")
        self.assertTrue(isinstance(self.mp3_4.info.encoder_info, text_type))

    def test_bitrate_mode(self):
        self.failUnlessEqual(self.mp3.info.bitrate_mode, BitrateMode.UNKNOWN)
        self.failUnlessEqual(self.mp3_2.info.bitrate_mode, BitrateMode.UNKNOWN)
        self.failUnlessEqual(self.mp3_3.info.bitrate_mode, BitrateMode.VBR)
        self.failUnlessEqual(self.mp3_4.info.bitrate_mode, BitrateMode.VBR)

    def test_id3(self):
        self.failUnlessEqual(self.mp3.tags, ID3(self.silence))
        self.failUnlessEqual(self.mp3_2.tags, ID3(self.silence_nov2))

    def test_length(self):
        self.assertAlmostEqual(self.mp3.info.length, 3.77, 2)
        self.assertAlmostEqual(self.mp3_2.info.length, 3.77, 2)
        self.assertAlmostEqual(self.mp3_3.info.length, 3.68475, 4)
        self.assertAlmostEqual(self.mp3_4.info.length, 3.68475, 4)

    def test_version(self):
        self.failUnlessEqual(self.mp3.info.version, 1)
        self.failUnlessEqual(self.mp3_2.info.version, 1)
        self.failUnlessEqual(self.mp3_3.info.version, 2)
        self.failUnlessEqual(self.mp3_4.info.version, 2.5)

    def test_layer(self):
        self.failUnlessEqual(self.mp3.info.layer, 3)
        self.failUnlessEqual(self.mp3_2.info.layer, 3)
        self.failUnlessEqual(self.mp3_3.info.layer, 3)
        self.failUnlessEqual(self.mp3_4.info.layer, 3)

    def test_bitrate(self):
        self.failUnlessEqual(self.mp3.info.bitrate, 32000)
        self.failUnlessEqual(self.mp3_2.info.bitrate, 32000)
        self.failUnlessEqual(self.mp3_3.info.bitrate, 18602)
        self.failUnlessEqual(self.mp3_4.info.bitrate, 9691)

    def test_notmp3(self):
        self.failUnlessRaises(
            MP3Error, MP3, os.path.join(DATA_DIR, 'empty.ofr'))

        self.failUnlessRaises(
            MP3Error, MP3, os.path.join(DATA_DIR, 'emptyfile.mp3'))

    def test_too_short(self):
        self.failUnlessRaises(
            MP3Error, MP3, os.path.join(DATA_DIR, 'too-short.mp3'))

    def test_sketchy(self):
        self.failIf(self.mp3.info.sketchy)
        self.failIf(self.mp3_2.info.sketchy)
        self.failIf(self.mp3_3.info.sketchy)
        self.failIf(self.mp3_4.info.sketchy)

    def test_sketchy_notmp3(self):
        notmp3 = MP3(os.path.join(DATA_DIR, "silence-44-s.flac"))
        self.failUnless(notmp3.info.sketchy)
        self.assertTrue(u"sketchy" in notmp3.info.pprint())

    def test_pprint(self):
        self.failUnless(self.mp3.pprint())

    def test_info_pprint(self):
        res = self.mp3.info.pprint()
        self.assertTrue(res)
        self.assertTrue(isinstance(res, text_type))
        self.assertTrue(res.startswith(u"MPEG 1 layer 3"))

    def test_pprint_no_tags(self):
        self.mp3.tags = None
        self.failUnless(self.mp3.pprint())

    def test_xing(self):
        mp3 = MP3(os.path.join(DATA_DIR, "xing.mp3"))
        self.assertAlmostEqual(mp3.info.length, 2.052, 3)
        self.assertEqual(mp3.info.bitrate, 32000)

    def test_vbri(self):
        mp3 = MP3(os.path.join(DATA_DIR, "vbri.mp3"))
        self.assertAlmostEqual(mp3.info.length, 222.19755, 3)
        self.assertEqual(mp3.info.bitrate, 233260)

    def test_empty_xing(self):
        mp3 = MP3(os.path.join(DATA_DIR, "bad-xing.mp3"))
        self.assertEqual(mp3.info.length, 0)
        self.assertEqual(mp3.info.bitrate, 48000)

    def test_delete(self):
        self.mp3.delete()
        self.failIf(self.mp3.tags)
        self.failUnless(MP3(self.filename).tags is None)

    def test_module_delete(self):
        delete(self.filename)
        self.failUnless(MP3(self.filename).tags is None)

    def test_save(self):
        self.mp3["TIT1"].text = ["foobar"]
        self.mp3.save()
        self.failUnless(MP3(self.filename)["TIT1"] == "foobar")

    def test_save_padding(self):
        self.mp3.save(padding=lambda x: 42)
        self.assertEqual(MP3(self.filename).tags._padding, 42)

    def test_load_non_id3(self):
        filename = os.path.join(DATA_DIR, "apev2-lyricsv2.mp3")
        from mutagen.apev2 import APEv2
        mp3 = MP3(filename, ID3=APEv2)
        self.failUnless("replaygain_track_peak" in mp3.tags)

    def test_add_tags(self):
        mp3 = MP3(os.path.join(DATA_DIR, "xing.mp3"))
        self.failIf(mp3.tags)
        mp3.add_tags()
        self.failUnless(isinstance(mp3.tags, ID3))

    def test_add_tags_already_there(self):
        mp3 = MP3(os.path.join(DATA_DIR, "silence-44-s.mp3"))
        self.failUnless(mp3.tags)
        self.failUnlessRaises(Exception, mp3.add_tags)

    def test_save_no_tags(self):
        self.mp3.tags = None
        self.mp3.save()
        self.assertTrue(self.mp3.tags is None)

    def test_mime(self):
        self.failUnless("audio/mp3" in self.mp3.mime)
        # XXX
        self.mp3.info.layer = 2
        self.failIf("audio/mp3" in self.mp3.mime)
        self.failUnless("audio/mp2" in self.mp3.mime)

    def tearDown(self):
        os.unlink(self.filename)


class TMPEGInfo(TestCase):

    def test_not_real_file(self):
        filename = os.path.join(DATA_DIR, "silence-44-s-v1.mp3")
        with open(filename, "rb") as h:
            fileobj = cBytesIO(h.read(20))
        self.failUnlessRaises(MP3Error, MPEGInfo, fileobj)

    def test_empty(self):
        fileobj = cBytesIO(b"")
        self.failUnlessRaises(MP3Error, MPEGInfo, fileobj)

    def test_xing_unknown_framecount(self):
        frame = (
            b'\xff\xfb\xe4\x0c\x00\x0f\xf0\x00\x00\x00\x00\x00\x00\x00\x00\x00'
            b'\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'
            b'\x00\x00\x00\x00Info\x00\x00\x00\x02\x00\xb4V@\x00\xb4R\x80\x00'
            b'\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'
        )
        fileobj = cBytesIO(frame)
        info = MPEGInfo(fileobj)
        assert info.bitrate == 320000
        assert info.length > 0


class TEasyMP3(TestCase):

    def setUp(self):
        self.filename = get_temp_copy(
            os.path.join(DATA_DIR, "silence-44-s.mp3"))
        self.mp3 = EasyMP3(self.filename)

    def test_artist(self):
        self.failUnless("artist" in self.mp3)

    def test_no_composer(self):
        self.failIf("composer" in self.mp3)

    def test_length(self):
        # https://github.com/quodlibet/mutagen/issues/125
        # easyid3, normal id3 and mpeg loading without tags should skip
        # the tags and get the right offset of the first frame
        easy = self.mp3.info
        noneasy = MP3(self.filename).info
        with open(self.filename, "rb") as h:
            nonid3 = MPEGInfo(h)

        self.failUnlessEqual(easy.length, noneasy.length)
        self.failUnlessEqual(noneasy.length, nonid3.length)

    def tearDown(self):
        os.unlink(self.filename)


class TXingHeader(TestCase):

    def test_valid_info_header(self):
        data = (b'Info\x00\x00\x00\x0f\x00\x00:>\x00\xed\xbd8\x00\x03\x05\x07'
                b'\n\r\x0f\x12\x14\x17\x1a\x1c\x1e"$&)+.1359;=@CEGJLORTVZ\\^ac'
                b'fikmqsux{}\x80\x82\x84\x87\x8a\x8c\x8e\x92\x94\x96\x99\x9c'
                b'\x9e\xa1\xa3\xa5\xa9\xab\xad\xb0\xb3\xb5\xb8\xba\xbd\xc0\xc2'
                b'\xc4\xc6\xca\xcc\xce\xd1\xd4\xd6\xd9\xdb\xdd\xe1\xe3\xe5\xe8'
                b'\xeb\xed\xf0\xf2\xf5\xf8\xfa\xfc\x00\x00\x009')

        fileobj = cBytesIO(data)
        xing = XingHeader(fileobj)
        self.assertEqual(xing.bytes, 15580472)
        self.assertEqual(xing.frames, 14910)
        self.assertEqual(xing.vbr_scale, 57)
        self.assertTrue(xing.toc)
        self.assertEqual(len(xing.toc), 100)
        self.assertEqual(sum(xing.toc), 12625)  # only for coverage..
        self.assertEqual(xing.is_info, True)

        XingHeader(cBytesIO(data.replace(b'Info', b'Xing')))

    def test_invalid(self):
        self.assertRaises(XingHeaderError, XingHeader, cBytesIO(b""))
        self.assertRaises(XingHeaderError, XingHeader, cBytesIO(b"Xing"))
        self.assertRaises(XingHeaderError, XingHeader, cBytesIO(b"aaaa"))

    def test_get_offset(self):
        mp3 = MP3(os.path.join(DATA_DIR, "silence-44-s.mp3"))
        self.assertEqual(XingHeader.get_offset(mp3.info), 36)


class TVBRIHeader(TestCase):

    def test_valid(self):
        # parts of the trailing toc zeroed...
        data = (b'VBRI\x00\x01\t1\x00d\x00\x0c\xb05\x00\x00\x049\x00\x87\x00'
                b'\x01\x00\x02\x00\x08\n0\x19H\x18\xe0\x18x\x18\xe0\x18x\x19H'
                b'\x18\xe0\x19H\x18\xe0\x18\xe0\x18x' + b'\x00' * 300)

        fileobj = cBytesIO(data)
        vbri = VBRIHeader(fileobj)
        self.assertEqual(vbri.bytes, 831541)
        self.assertEqual(vbri.frames, 1081)
        self.assertEqual(vbri.quality, 100)
        self.assertEqual(vbri.version, 1)
        self.assertEqual(vbri.toc_frames, 8)
        self.assertTrue(vbri.toc)
        self.assertEqual(len(vbri.toc), 135)
        self.assertEqual(sum(vbri.toc), 72656)

    def test_invalid(self):
        self.assertRaises(VBRIHeaderError, VBRIHeader, cBytesIO(b""))
        self.assertRaises(VBRIHeaderError, VBRIHeader, cBytesIO(b"VBRI"))
        self.assertRaises(VBRIHeaderError, VBRIHeader, cBytesIO(b"Xing"))

    def test_get_offset(self):
        mp3 = MP3(os.path.join(DATA_DIR, "silence-44-s.mp3"))
        self.assertEqual(VBRIHeader.get_offset(mp3.info), 36)


class TLAMEHeader(TestCase):

    def test_version(self):

        def parse(data):
            data = cBytesIO(data + b"\x00" * (20 - len(data)))
            return tuple(LAMEHeader.parse_version(data)[1:])

        self.assertEqual(parse(b"LAME3.80"), (u"3.80", False))
        self.assertEqual(parse(b"LAME3.80 "), (u"3.80", False))
        self.assertEqual(parse(b"LAME3.88 (beta)"), (u"3.88 (beta)", False))
        self.assertEqual(parse(b"LAME3.90 (alpha)"), (u"3.90 (alpha)", False))
        self.assertEqual(parse(b"LAME3.90 "), (u"3.90.0+", True))
        self.assertEqual(parse(b"LAME3.96a"), (u"3.96 (alpha)", True))
        self.assertEqual(parse(b"LAME3.96b"), (u"3.96 (beta)", True))
        self.assertEqual(parse(b"LAME3.96x"), (u"3.96 (?)", True))
        self.assertEqual(parse(b"LAME3.98 "), (u"3.98.0", True))
        self.assertEqual(parse(b"LAME3.96r"), (u"3.96.1+", True))
        self.assertEqual(parse(b"L3.99r"), (u"3.99.1+", True))
        self.assertEqual(parse(b"LAME3100r"), (u"3.100.1+", True))
        self.assertEqual(parse(b"LAME3.90.\x03\xbe\x00"), (u"3.90.0+", True))
        self.assertEqual(parse(b"LAME3.100"), (u"3.100.0+", True))

    def test_invalid(self):

        def parse(data):
            data = cBytesIO(data + b"\x00" * (20 - len(data)))
            return LAMEHeader.parse_version(data)

        self.assertRaises(LAMEError, parse, b"")
        self.assertRaises(LAMEError, parse, b"LAME")
        self.assertRaises(LAMEError, parse, b"LAME3.9999")

    def test_real(self):
        with open(os.path.join(DATA_DIR, "lame.mp3"), "rb") as h:
            h.seek(36, 0)
            xing = XingHeader(h)
            self.assertEqual(xing.lame_version_desc, u"3.99.1+")
            self.assertTrue(xing.lame_header)
            self.assertEqual(xing.lame_header.track_gain_adjustment, 6.0)
            assert xing.get_encoder_settings() == u"-V 2"

    def test_settings(self):
        with open(os.path.join(DATA_DIR, "lame.mp3"), "rb") as h:
            h.seek(36, 0)
            xing = XingHeader(h)
        header = xing.lame_header

        def s(major, minor, **kwargs):
            old = vars(header)
            for key, value in kwargs.items():
                assert hasattr(header, key)
                setattr(header, key, value)
            r = header.guess_settings(major, minor)
            header.__dict__.update(old)
            return r

        assert s(3, 99) == "-V 2"
        assert s(3, 98) == "-V 2"
        assert s(3, 97) == "-V 2 --vbr-new"
        assert s(3, 96) == "-V 2 --vbr-new"
        assert s(3, 95) == "-V 2 --vbr-new"
        assert s(3, 94) == "-V 2 --vbr-new"
        assert s(3, 93) == "-V 2 --vbr-new"
        assert s(3, 92) == "-V 2 --vbr-new"
        assert s(3, 91) == "-V 2 --vbr-new"
        assert s(3, 90) == "-V 2 --vbr-new"
        assert s(3, 89) == ""

        assert s(3, 91, vbr_method=2) == "--alt-preset 32"
        assert s(3, 91, vbr_method=2, bitrate=255) == "--alt-preset 255+"
        assert s(3, 99, vbr_method=2, preset_used=128) == "--preset 128"
        assert s(3, 99, vbr_method=2, preset_used=0, bitrate=48) == "--abr 48"
        assert \
            s(3, 94, vbr_method=2, preset_used=0, bitrate=255) == "--abr 255+"
        assert s(3, 99, vbr_method=3) == "-V 2 --vbr-old"
        assert s(3, 94, vbr_method=3) == "-V 2"
        assert s(3, 99, vbr_method=1, preset_used=1003) == "--preset insane"
        assert s(3, 93, vbr_method=3, preset_used=1001) == "--preset standard"
        assert s(3, 93, vbr_method=3, preset_used=1002) == "--preset extreme"
        assert s(3, 93, vbr_method=3, preset_used=1004) == \
            "--preset fast standard"
        assert s(3, 93, vbr_method=3, preset_used=1005) == \
            "--preset fast extreme"
        assert s(3, 93, vbr_method=3, preset_used=1006) == "--preset medium"
        assert s(3, 93, vbr_method=3, preset_used=1007) == \
            "--preset fast medium"
        assert s(3, 92, vbr_method=3) == "-V 2"
        assert s(3, 92, vbr_method=1, preset_used=0, bitrate=254) == "-b 254"
        assert s(3, 92, vbr_method=1, preset_used=0, bitrate=255) == "-b 255+"

        def skey(major, minor, args):
            keys = ["vbr_quality", "quality", "vbr_method", "lowpass_filter",
                    "ath_type"]
            return s(major, minor, **dict(zip(keys, args)))

        assert skey(3, 91, (1, 2, 4, 19500, 3)) == "--preset r3mix"
        assert skey(3, 91, (2, 2, 3, 19000, 4)) == "--alt-preset standard"
        assert skey(3, 91, (2, 2, 3, 19500, 2)) == "--alt-preset extreme"

    def test_length(self):
        mp3 = MP3(os.path.join(DATA_DIR, "lame.mp3"))
        self.assertAlmostEqual(mp3.info.length, 0.06160, 4)
