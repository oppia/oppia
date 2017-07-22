# -*- coding: utf-8 -*-

import os

from mutagen import id3
from mutagen import MutagenError
from mutagen.apev2 import APEv2
from mutagen.id3 import ID3, Frames, ID3UnsupportedVersionError, TIT2, \
    CHAP, CTOC, TT1, TCON, COMM, TORY, PIC, MakeID3v1, TRCK, TYER, TDRC, \
    TDAT, TIME, LNK, IPLS, TPE1, BinaryFrame, TIT3, POPM, APIC, CRM, \
    TALB, TPE2, TSOT, TDEN, TIPL, ParseID3v1, Encoding, ID3Tags, RVAD, \
    ID3NoHeaderError
from mutagen.id3._util import BitPaddedInt, error as ID3Error
from mutagen.id3._tags import determine_bpi, ID3Header, \
    save_frame, ID3SaveConfig
from mutagen.id3._id3v1 import find_id3v1
from mutagen._compat import cBytesIO, xrange

from tests import TestCase, DATA_DIR, get_temp_copy, get_temp_empty


class TID3Read(TestCase):

    empty = os.path.join(DATA_DIR, 'emptyfile.mp3')
    silence = os.path.join(DATA_DIR, 'silence-44-s.mp3')
    unsynch = os.path.join(DATA_DIR, 'id3v23_unsynch.id3')
    v22 = os.path.join(DATA_DIR, "id3v22-test.mp3")
    bad_tyer = os.path.join(DATA_DIR, 'bad-TYER-frame.mp3')

    def test_PIC_in_23(self):
        filename = get_temp_empty(".mp3")

        try:
            with open(filename, "wb") as h:
                # contains a bad upgraded frame, 2.3 structure with 2.2 name.
                # PIC was upgraded to APIC, but mime was not
                h.write(b"ID3\x03\x00\x00\x00\x00\x08\x00PIC\x00\x00\x00"
                        b"\x00\x0b\x00\x00\x00JPG\x00\x03foo\x00\x42"
                        b"\x00" * 100)
            id3 = ID3(filename)
            self.assertEqual(id3.version, (2, 3, 0))
            self.assertTrue(id3.getall("APIC"))
            frame = id3.getall("APIC")[0]
            self.assertEqual(frame.mime, "image/jpeg")
            self.assertEqual(frame.data, b"\x42")
            self.assertEqual(frame.type, 3)
            self.assertEqual(frame.desc, "foo")
        finally:
            os.remove(filename)

    def test_bad_tyer(self):
        audio = ID3(self.bad_tyer)
        self.failIf("TYER" in audio)
        self.failUnless("TIT2" in audio)

    def test_tdrc(self):
        tags = ID3()
        tags.add(id3.TDRC(encoding=1, text="2003-04-05 12:03"))
        tags.update_to_v23()
        self.failUnlessEqual(tags["TYER"].text, ["2003"])
        self.failUnlessEqual(tags["TDAT"].text, ["0504"])
        self.failUnlessEqual(tags["TIME"].text, ["1203"])

    def test_tdor(self):
        tags = ID3()
        tags.add(id3.TDOR(encoding=1, text="2003-04-05 12:03"))
        tags.update_to_v23()
        self.failUnlessEqual(tags["TORY"].text, ["2003"])

    def test_genre_from_v24_1(self):
        tags = ID3()
        tags.add(id3.TCON(encoding=1, text=["4", "Rock"]))
        tags.update_to_v23()
        self.failUnlessEqual(tags["TCON"].text, ["Disco", "Rock"])

    def test_genre_from_v24_2(self):
        tags = ID3()
        tags.add(id3.TCON(encoding=1, text=["RX", "3", "CR"]))
        tags.update_to_v23()
        self.failUnlessEqual(tags["TCON"].text, ["Remix", "Dance", "Cover"])

    def test_genre_from_v23_1(self):
        tags = ID3()
        tags.add(id3.TCON(encoding=1, text=["(4)Rock"]))
        tags.update_to_v23()
        self.failUnlessEqual(tags["TCON"].text, ["Disco", "Rock"])

    def test_genre_from_v23_2(self):
        tags = ID3()
        tags.add(id3.TCON(encoding=1, text=["(RX)(3)(CR)"]))
        tags.update_to_v23()
        self.failUnlessEqual(tags["TCON"].text, ["Remix", "Dance", "Cover"])

    def test_ipls_to_v23(self):
        tags = ID3()
        tags.version = (2, 3)
        tags.add(id3.TIPL(encoding=0, people=[["a", "b"], ["c", "d"]]))
        tags.add(id3.TMCL(encoding=0, people=[["e", "f"], ["g", "h"]]))
        tags.update_to_v23()
        self.failUnlessEqual(tags["IPLS"], [["a", "b"], ["c", "d"],
                                            ["e", "f"], ["g", "h"]])

    def test_tags(self):
        tags = ID3(self.v22)
        self.failUnless(tags["TRCK"].text == ["3/11"])
        self.failUnless(tags["TPE1"].text == ["Anais Mitchell"])

    def test_empty_file(self):
        self.assertRaises(ID3Error, ID3, filename=self.empty)

    def test_nonexistent_file(self):
        name = os.path.join(DATA_DIR, 'does', 'not', 'exist')
        self.assertRaises(MutagenError, ID3, name)

    def test_read_padding(self):
        self.assertEqual(ID3(self.silence)._padding, 1142)
        self.assertEqual(ID3(self.unsynch)._padding, 0)

    def test_load_v23_unsynch(self):
        id3 = ID3(self.unsynch)
        self.assertEquals(id3["TPE1"], ["Nina Simone"])

    def test_bad_extended_header_flags(self):
        # Files with bad extended header flags failed to read tags.
        # Ensure the extended header is turned off, and the frames are
        # read.
        id3 = ID3(os.path.join(DATA_DIR, 'issue_21.id3'))
        self.failIf(id3.f_extended)
        self.failUnless("TIT2" in id3)
        self.failUnless("TALB" in id3)
        self.failUnlessEqual(id3["TIT2"].text, [u"Punk To Funk"])

    def test_no_known_frames(self):
        id3 = ID3(self.silence, known_frames={})
        self.assertEquals(0, len(id3.keys()))
        self.assertEquals(9, len(id3.unknown_frames))

    def test_unknown_reset(self):
        id3 = ID3(self.silence, known_frames={})
        self.assertEquals(9, len(id3.unknown_frames))
        id3.load(self.silence, known_frames={})
        self.assertEquals(9, len(id3.unknown_frames))

    def test_23_multiframe_hack(self):

        # loaded_frame is no longer used in mutagen, but this makes
        # sure that old code keeps working (used in quod libet <=3.6)
        class ID3hack(ID3):
            "Override 'correct' behavior with desired behavior"
            def loaded_frame(self, tag):
                if tag.HashKey in self:
                    self[tag.HashKey].extend(tag[:])
                else:
                    self[tag.HashKey] = tag

        id3 = ID3hack(self.silence)
        self.assertEquals(8, len(id3.keys()))
        self.assertEquals(0, len(id3.unknown_frames))
        self.assertEquals('Quod Libet Test Data', id3['TALB'])
        self.assertEquals('Silence', str(id3['TCON']))
        self.assertEquals('Silence', str(id3['TIT1']))
        self.assertEquals('Silence', str(id3['TIT2']))
        self.assertEquals(3000, +id3['TLEN'])
        self.assertEquals(['piman', 'jzig'], id3['TPE1'])
        self.assertEquals('02/10', id3['TRCK'])
        self.assertEquals(2, +id3['TRCK'])
        self.assertEquals('2004', id3['TDRC'])

    def test_chap_subframes(self):
        id3 = ID3()
        id3.version = (2, 3)
        id3.add(CHAP(element_id="foo", start_time=0, end_time=0,
                     start_offset=0, end_offset=0,
                     sub_frames=[TYER(encoding=0, text="2006")]))
        id3.update_to_v24()
        chap = id3.getall("CHAP:foo")[0]
        self.assertEqual(chap.sub_frames.getall("TDRC")[0], u"2006")
        self.assertFalse(chap.sub_frames.getall("TYER"))
        id3.update_to_v23()
        self.assertEqual(chap.sub_frames.getall("TYER")[0], u"2006")

    def test_ctoc_subframes(self):
        id3 = ID3()
        id3.version = (2, 3)
        id3.add(CTOC(sub_frames=[TYER(encoding=0, text="2006")]))
        id3.update_to_v24()
        ctoc = id3.getall("CTOC")[0]
        self.assertEqual(ctoc.sub_frames.getall("TDRC")[0], u"2006")
        self.assertFalse(ctoc.sub_frames.getall("TYER"))
        id3.update_to_v23()
        self.assertEqual(ctoc.sub_frames.getall("TYER")[0], u"2006")

    def test_pic(self):
        id3 = ID3()
        id3.version = (2, 2)
        id3.add(PIC(encoding=0, mime="PNG", desc="cover", type=3, data=b""))
        id3.update_to_v24()
        self.failUnlessEqual(id3["APIC:cover"].mime, "image/png")

    def test_lnk(self):
        id3 = ID3()
        id3.version = (2, 2)
        id3.add(LNK(frameid="PIC", url="http://foo.bar"))
        id3.update_to_v24()
        self.assertTrue(id3.getall("LINK"))

    def test_tyer(self):
        id3 = ID3()
        id3.version = (2, 3)
        id3.add(TYER(encoding=0, text="2006"))
        id3.update_to_v24()
        self.failUnlessEqual(id3["TDRC"], "2006")

    def test_tyer_tdat(self):
        id3 = ID3()
        id3.version = (2, 3)
        id3.add(TYER(encoding=0, text="2006"))
        id3.add(TDAT(encoding=0, text="0603"))
        id3.update_to_v24()
        self.failUnlessEqual(id3["TDRC"], "2006-03-06")

    def test_tyer_tdat_time(self):
        id3 = ID3()
        id3.version = (2, 3)
        id3.add(TYER(encoding=0, text="2006"))
        id3.add(TDAT(encoding=0, text="0603"))
        id3.add(TIME(encoding=0, text="1127"))
        id3.update_to_v24()
        self.failUnlessEqual(id3["TDRC"], "2006-03-06 11:27:00")

    def test_tory(self):
        id3 = ID3()
        id3.version = (2, 3)
        id3.add(TORY(encoding=0, text="2006"))
        id3.update_to_v24()
        self.failUnlessEqual(id3["TDOR"], "2006")

    def test_ipls(self):
        id3 = ID3()
        id3.version = (2, 3)
        id3.add(IPLS(encoding=0, people=[["a", "b"], ["c", "d"]]))
        id3.update_to_v24()
        self.failUnlessEqual(id3["TIPL"], [["a", "b"], ["c", "d"]])

    def test_time_dropped(self):
        id3 = ID3()
        id3.version = (2, 3)
        id3.add(TIME(encoding=0, text=["1155"]))
        id3.update_to_v24()
        self.assertFalse(id3.getall("TIME"))

    def test_rvad_dropped(self):
        id3 = ID3()
        id3.version = (2, 3)
        id3.add(RVAD())
        id3.update_to_v24()
        self.assertFalse(id3.getall("RVAD"))


class TID3Header(TestCase):

    silence = os.path.join(DATA_DIR, 'silence-44-s.mp3')
    empty = os.path.join(DATA_DIR, 'emptyfile.mp3')

    def test_header_empty(self):
        with open(self.empty, 'rb') as fileobj:
            self.assertRaises(ID3Error, ID3Header, fileobj)

    def test_header_silence(self):
        with open(self.silence, 'rb') as fileobj:
            header = ID3Header(fileobj)
        self.assertEquals(header.version, (2, 3, 0))
        self.assertEquals(header.size, 1314)

    def test_header_2_4_invalid_flags(self):
        fileobj = cBytesIO(b'ID3\x04\x00\x1f\x00\x00\x00\x00')
        self.assertRaises(ID3Error, ID3Header, fileobj)

    def test_header_2_4_unsynch_size(self):
        fileobj = cBytesIO(b'ID3\x04\x00\x10\x00\x00\x00\xFF')
        self.assertRaises(ID3Error, ID3Header, fileobj)

    def test_header_2_4_allow_footer(self):
        fileobj = cBytesIO(b'ID3\x04\x00\x10\x00\x00\x00\x00')
        self.assertTrue(ID3Header(fileobj).f_footer)

    def test_header_2_3_invalid_flags(self):
        fileobj = cBytesIO(b'ID3\x03\x00\x1f\x00\x00\x00\x00')
        self.assertRaises(ID3Error, ID3Header, fileobj)

        fileobj = cBytesIO(b'ID3\x03\x00\x0f\x00\x00\x00\x00')
        self.assertRaises(ID3Error, ID3Header, fileobj)

    def test_header_2_2(self):
        fileobj = cBytesIO(b'ID3\x02\x00\x00\x00\x00\x00\x00')
        header = ID3Header(fileobj)
        self.assertEquals(header.version, (2, 2, 0))

    def test_header_2_1(self):
        fileobj = cBytesIO(b'ID3\x01\x00\x00\x00\x00\x00\x00')
        self.assertRaises(ID3UnsupportedVersionError, ID3Header, fileobj)

    def test_header_too_small(self):
        fileobj = cBytesIO(b'ID3\x01\x00\x00\x00\x00\x00')
        self.assertRaises(ID3Error, ID3Header, fileobj)

    def test_header_2_4_extended(self):
        fileobj = cBytesIO(
            b'ID3\x04\x00\x40\x00\x00\x00\x00\x00\x00\x00\x05\x5a')
        header = ID3Header(fileobj)
        self.assertEquals(header._extdata, b'\x5a')

    def test_header_2_4_extended_unsynch_size(self):
        fileobj = cBytesIO(
            b'ID3\x04\x00\x40\x00\x00\x00\x00\x00\x00\x00\xFF\x5a')
        self.assertRaises(ID3Error, ID3Header, fileobj)

    def test_header_2_4_extended_but_not(self):
        fileobj = cBytesIO(
            b'ID3\x04\x00\x40\x00\x00\x00\x00TIT1\x00\x00\x00\x01a')
        header = ID3Header(fileobj)
        self.assertEquals(header._extdata, b'')

    def test_header_2_4_extended_but_not_but_not_tag(self):
        fileobj = cBytesIO(b'ID3\x04\x00\x40\x00\x00\x00\x00TIT9')
        self.failUnlessRaises(ID3Error, ID3Header, fileobj)

    def test_header_2_3_extended(self):
        fileobj = cBytesIO(
            b'ID3\x03\x00\x40\x00\x00\x00\x00\x00\x00\x00\x06'
            b'\x00\x00\x56\x78\x9a\xbc')
        header = ID3Header(fileobj)
        self.assertEquals(header._extdata, b'\x00\x00\x56\x78\x9a\xbc')

    def test_23(self):
        id3 = ID3(self.silence)
        self.assertEqual(id3.version, (2, 3, 0))
        self.assertEquals(8, len(id3.keys()))
        self.assertEquals(0, len(id3.unknown_frames))
        self.assertEquals('Quod Libet Test Data', id3['TALB'])
        self.assertEquals('Silence', str(id3['TCON']))
        self.assertEquals('Silence', str(id3['TIT1']))
        self.assertEquals('Silence', str(id3['TIT2']))
        self.assertEquals(3000, +id3['TLEN'])
        self.assertEquals(['piman', 'jzig'], id3['TPE1'])
        self.assertEquals('02/10', id3['TRCK'])
        self.assertEquals(2, +id3['TRCK'])
        self.assertEquals('2004', id3['TDRC'])


class TID3Tags(TestCase):

    silence = os.path.join(DATA_DIR, 'silence-44-s.mp3')

    def setUp(self):
        self.frames = [
            TIT2(text=["1"]), TIT2(text=["2"]),
            TIT2(text=["3"]), TIT2(text=["4"])]
        self.i = ID3Tags()
        self.i["BLAH"] = self.frames[0]
        self.i["QUUX"] = self.frames[1]
        self.i["FOOB:ar"] = self.frames[2]
        self.i["FOOB:az"] = self.frames[3]

    def test_apic_duplicate_hash(self):
        id3 = ID3Tags()
        for i in xrange(10):
            apic = APIC(encoding=0, mime=u"b", type=3, desc=u"", data=b"a")
            id3._add(apic, False)

        self.assertEqual(len(id3), 10)
        for key, value in id3.items():
            self.assertEqual(key, value.HashKey)

    def test_text_duplicate_frame_different_encoding(self):
        id3 = ID3Tags()
        frame = TPE2(encoding=Encoding.LATIN1, text=[u"foo"])
        id3._add(frame, False)
        assert id3.getall("TPE2")[0].encoding == Encoding.LATIN1
        frame = TPE2(encoding=Encoding.LATIN1, text=[u"bar"])
        id3._add(frame, False)
        assert id3.getall("TPE2")[0].encoding == Encoding.LATIN1
        frame = TPE2(encoding=Encoding.UTF8, text=[u"baz\u0400"])
        id3._add(frame, False)
        assert id3.getall("TPE2")[0].encoding == Encoding.UTF8

        frames = id3.getall("TPE2")
        assert len(frames) == 1
        assert len(frames[0].text) == 3

    def test_add_CRM(self):
        id3 = ID3Tags()
        self.assertRaises(TypeError, id3.add, CRM())

    def test_read__ignore_CRM(self):
        tags = ID3Tags()
        header = ID3Header()
        header.version = ID3Header._V22

        framedata = CRM(owner="foo", desc="bar", data=b"bla")._writeData()
        datasize = BitPaddedInt.to_str(len(framedata), width=3, bits=8)
        tags._read(header, b"CRM" + datasize + framedata)
        self.assertEqual(len(tags), 0)

    def test_update_v22_add(self):
        id3 = ID3Tags()
        tt1 = TT1(encoding=0, text=u'whatcha staring at?')
        id3.loaded_frame(tt1)
        tit1 = id3['TIT1']

        self.assertEquals(tt1.encoding, tit1.encoding)
        self.assertEquals(tt1.text, tit1.text)
        self.assert_('TT1' not in id3)

    def test_getnormal(self):
        self.assertEquals(self.i.getall("BLAH"), [self.frames[0]])
        self.assertEquals(self.i.getall("QUUX"), [self.frames[1]])
        self.assertEquals(self.i.getall("FOOB:ar"), [self.frames[2]])
        self.assertEquals(self.i.getall("FOOB:az"), [self.frames[3]])

    def test_getlist(self):
        self.assertTrue(
            self.i.getall("FOOB") in [[self.frames[2], self.frames[3]],
                                      [self.frames[3], self.frames[2]]])

    def test_delnormal(self):
        self.assert_("BLAH" in self.i)
        self.i.delall("BLAH")
        self.assert_("BLAH" not in self.i)

    def test_delone(self):
        self.i.delall("FOOB:ar")
        self.assertEquals(self.i.getall("FOOB"), [self.frames[3]])

    def test_delall(self):
        self.assert_("FOOB:ar" in self.i)
        self.assert_("FOOB:az" in self.i)
        self.i.delall("FOOB")
        self.assert_("FOOB:ar" not in self.i)
        self.assert_("FOOB:az" not in self.i)

    def test_setone(self):
        class TEST(TIT2):
            HashKey = ""

        t = TEST()
        t.HashKey = "FOOB:ar"
        self.i.setall("FOOB", [t])
        self.assertEquals(self.i["FOOB:ar"], t)
        self.assertEquals(self.i.getall("FOOB"), [t])

    def test_settwo(self):
        class TEST(TIT2):
            HashKey = ""

        t = TEST()
        t.HashKey = "FOOB:ar"
        t2 = TEST()
        t2.HashKey = "FOOB:az"
        self.i.setall("FOOB", [t, t2])
        self.assertEquals(self.i["FOOB:ar"], t)
        self.assertEquals(self.i["FOOB:az"], t2)
        self.assert_(self.i.getall("FOOB") in [[t, t2], [t2, t]])

    def test_set_wrong_type(self):
        id3 = ID3Tags()
        self.assertRaises(TypeError, id3.__setitem__, "FOO", object())


class ID3v1Tags(TestCase):

    def setUp(self):
        self.filename = os.path.join(DATA_DIR, 'silence-44-s-v1.mp3')
        self.id3 = ID3(self.filename)

    def test_album(self):
        self.assertEquals('Quod Libet Test Data', self.id3['TALB'])

    def test_genre(self):
        self.assertEquals('Darkwave', self.id3['TCON'].genres[0])

    def test_title(self):
        self.assertEquals('Silence', str(self.id3['TIT2']))

    def test_artist(self):
        self.assertEquals(['piman'], self.id3['TPE1'])

    def test_track(self):
        self.assertEquals('2', self.id3['TRCK'])
        self.assertEquals(2, +self.id3['TRCK'])

    def test_year(self):
        self.assertEquals('2004', self.id3['TDRC'])

    def test_v1_not_v11(self):
        self.id3["TRCK"] = TRCK(encoding=0, text="32")
        tag = MakeID3v1(self.id3)
        self.failUnless(32, ParseID3v1(tag)["TRCK"])
        del(self.id3["TRCK"])
        tag = MakeID3v1(self.id3)
        tag = tag[:125] + b'  ' + tag[-1:]
        self.failIf("TRCK" in ParseID3v1(tag))

    def test_nulls(self):
        s = u'TAG%(title)30s%(artist)30s%(album)30s%(year)4s%(cmt)29s\x03\x01'
        s = s % dict(artist=u'abcd\00fg', title=u'hijklmn\x00p',
                     album=u'qrst\x00v', cmt=u'wxyz', year=u'1224')
        tags = ParseID3v1(s.encode("ascii"))
        self.assertEquals(b'abcd'.decode('latin1'), tags['TPE1'])
        self.assertEquals(b'hijklmn'.decode('latin1'), tags['TIT2'])
        self.assertEquals(b'qrst'.decode('latin1'), tags['TALB'])

    def test_nonascii(self):
        s = u'TAG%(title)30s%(artist)30s%(album)30s%(year)4s%(cmt)29s\x03\x01'
        s = s % dict(artist=u'abcd\xe9fg', title=u'hijklmn\xf3p',
                     album=u'qrst\xfcv', cmt=u'wxyz', year=u'1234')
        tags = ParseID3v1(s.encode("latin-1"))
        self.assertEquals(b'abcd\xe9fg'.decode('latin1'), tags['TPE1'])
        self.assertEquals(b'hijklmn\xf3p'.decode('latin1'), tags['TIT2'])
        self.assertEquals(b'qrst\xfcv'.decode('latin1'), tags['TALB'])
        self.assertEquals('wxyz', tags['COMM'])
        self.assertEquals("3", tags['TRCK'])
        self.assertEquals("1234", tags['TDRC'])

    def test_roundtrip(self):
        frames = {}
        for key in ["TIT2", "TALB", "TPE1", "TDRC"]:
            frames[key] = self.id3[key]
        self.assertEquals(ParseID3v1(MakeID3v1(frames)), frames)

    def test_make_from_empty(self):
        empty = b'TAG' + b'\x00' * 124 + b'\xff'
        self.assertEquals(MakeID3v1({}), empty)
        self.assertEquals(MakeID3v1({'TCON': TCON()}), empty)
        self.assertEquals(
            MakeID3v1({'COMM': COMM(encoding=0, text="")}), empty)

    def test_make_v1_from_tyer(self):
        self.assertEquals(
            MakeID3v1({"TDRC": TDRC(text="2010-10-10")}),
            MakeID3v1({"TYER": TYER(text="2010")}))
        self.assertEquals(
            ParseID3v1(MakeID3v1({"TDRC": TDRC(text="2010-10-10")})),
            ParseID3v1(MakeID3v1({"TYER": TYER(text="2010")})))

    def test_invalid(self):
        self.failUnless(ParseID3v1(b"") is None)

    def test_invalid_track(self):
        tag = {}
        tag["TRCK"] = TRCK(encoding=0, text="not a number")
        v1tag = MakeID3v1(tag)
        self.failIf("TRCK" in ParseID3v1(v1tag))

    def test_v1_genre(self):
        tag = {}
        tag["TCON"] = TCON(encoding=0, text="Pop")
        v1tag = MakeID3v1(tag)
        self.failUnlessEqual(ParseID3v1(v1tag)["TCON"].genres, ["Pop"])


class TestWriteID3v1(TestCase):

    def setUp(self):
        self.filename = get_temp_copy(
            os.path.join(DATA_DIR, "silence-44-s.mp3"))
        self.audio = ID3(self.filename)

    def failIfV1(self):
        with open(self.filename, "rb") as fileobj:
            fileobj.seek(-128, 2)
            self.failIf(fileobj.read(3) == b"TAG")

    def failUnlessV1(self):
        with open(self.filename, "rb") as fileobj:
            fileobj.seek(-128, 2)
            self.failUnless(fileobj.read(3) == b"TAG")

    def test_save_delete(self):
        self.audio.save(v1=0)
        self.failIfV1()

    def test_save_add(self):
        self.audio.save(v1=2)
        self.failUnlessV1()

    def test_save_defaults(self):
        self.audio.save(v1=0)
        self.failIfV1()
        self.audio.save(v1=1)
        self.failIfV1()
        self.audio.save(v1=2)
        self.failUnlessV1()
        self.audio.save(v1=1)
        self.failUnlessV1()

    def tearDown(self):
        os.unlink(self.filename)


class Issue97_UpgradeUnknown23(TestCase):

    def setUp(self):
        self.filename = get_temp_copy(
            os.path.join(DATA_DIR, "97-unknown-23-update.mp3"))

    def tearDown(self):
        os.unlink(self.filename)

    def test_unknown(self):
        orig = ID3(self.filename)
        self.failUnlessEqual(orig.version, (2, 3, 0))

        # load a 2.3 file and pretend we don't support TIT2
        unknown = ID3(self.filename, known_frames={"TPE1": TPE1},
                      translate=False)
        # TIT2 ends up in unknown_frames
        self.failUnlessEqual(unknown.unknown_frames[0][:4], b"TIT2")
        # save as 2.3
        unknown.save(v2_version=3)
        # load again with support for TIT2, all should be there again
        new = ID3(self.filename)
        self.failUnlessEqual(new["TIT2"].text, orig["TIT2"].text)
        self.failUnlessEqual(new["TPE1"].text, orig["TPE1"].text)

    def test_unknown_invalid(self):
        frame = BinaryFrame(data=b"\xff" * 50)
        f = ID3(self.filename)
        self.assertEqual(f.version, ID3Header._V23)
        config = ID3SaveConfig(3, None)
        f.unknown_frames = [save_frame(frame, b"NOPE", config)]
        f.save()
        f = ID3(self.filename)
        self.assertFalse(f.unknown_frames)


class TID3Write(TestCase):

    def setUp(self):
        self.filename = get_temp_copy(
            os.path.join(DATA_DIR, 'silence-44-s.mp3'))

    def tearDown(self):
        try:
            os.unlink(self.filename)
        except OSError:
            pass

    def test_corrupt_header_too_small(self):
        with open(self.filename, "r+b") as h:
            h.truncate(5)
        self.assertRaises(id3.error, ID3, self.filename)

    def test_corrupt_tag_too_small(self):
        with open(self.filename, "r+b") as h:
            h.truncate(50)
        self.assertRaises(id3.error, ID3, self.filename)

    def test_corrupt_save(self):
        with open(self.filename, "r+b") as h:
            h.seek(5, 0)
            h.write(b"nope")
        self.assertRaises(id3.error, ID3().save, self.filename)

    def test_padding_fill_all(self):
        tag = ID3(self.filename)
        self.assertEqual(tag._padding, 1142)
        tag.delall("TPE1")
        # saving should increase the padding not decrease the tag size
        tag.save()
        tag = ID3(self.filename)
        self.assertEqual(tag._padding, 1166)

    def test_padding_remove_add_padding(self):
        ID3(self.filename).save()

        tag = ID3(self.filename)
        old_padding = tag._padding
        old_size = os.path.getsize(self.filename)
        tag.save(padding=lambda x: 0)
        self.assertEqual(os.path.getsize(self.filename),
                         old_size - old_padding)
        old_size = old_size - old_padding
        tag.save(padding=lambda x: 137)
        self.assertEqual(os.path.getsize(self.filename),
                         old_size + 137)

    def test_save_id3_over_ape(self):
        id3.delete(self.filename, delete_v2=False)

        ape_tag = APEv2()
        ape_tag["oh"] = ["no"]
        ape_tag.save(self.filename)

        ID3(self.filename).save()
        self.assertEqual(APEv2(self.filename)["oh"], "no")

    def test_delete_id3_with_ape(self):
        ID3(self.filename).save(v1=2)

        ape_tag = APEv2()
        ape_tag["oh"] = ["no"]
        ape_tag.save(self.filename)

        id3.delete(self.filename, delete_v2=False)
        self.assertEqual(APEv2(self.filename)["oh"], "no")

    def test_ape_id3_lookalike(self):
        # mp3 with apev2 tag that parses as id3v1 (at least with ParseID3v1)

        id3.delete(self.filename, delete_v2=False)

        ape_tag = APEv2()
        ape_tag["oh"] = [
            "noooooooooo0000000000000000000000000000000000ooooooooooo"]
        ape_tag.save(self.filename)

        ID3(self.filename).save()
        self.assertTrue(APEv2(self.filename))

    def test_update_to_v23_on_load(self):
        audio = ID3(self.filename)
        audio.add(TSOT(text=["Ha"], encoding=3))
        audio.save()

        # update_to_v23 called
        id3 = ID3(self.filename, v2_version=3)
        self.assertFalse(id3.getall("TSOT"))

        # update_to_v23 not called
        id3 = ID3(self.filename, v2_version=3, translate=False)
        self.assertTrue(id3.getall("TSOT"))

    def test_load_save_inval_version(self):
        audio = ID3(self.filename)
        self.assertRaises(ValueError, audio.save, v2_version=5)
        self.assertRaises(ValueError, ID3, self.filename, v2_version=5)

    def test_save(self):
        audio = ID3(self.filename)
        strings = ["one", "two", "three"]
        audio.add(TPE1(text=strings, encoding=3))
        audio.save(v2_version=3)

        frame = audio["TPE1"]
        self.assertEqual(frame.encoding, 3)
        self.assertEqual(frame.text, strings)

        id3 = ID3(self.filename, translate=False)
        self.assertEqual(id3.version, (2, 3, 0))
        frame = id3["TPE1"]
        self.assertEqual(frame.encoding, 1)
        self.assertEqual(frame.text, ["/".join(strings)])

        # null separator, mutagen can still read it
        audio.save(v2_version=3, v23_sep=None)

        id3 = ID3(self.filename, translate=False)
        self.assertEqual(id3.version, (2, 3, 0))
        frame = id3["TPE1"]
        self.assertEqual(frame.encoding, 1)
        self.assertEqual(frame.text, strings)

    def test_save_off_spec_frames(self):
        # These are not defined in v2.3 and shouldn't be written.
        # Still make sure reading them again works and the encoding
        # is at least changed

        audio = ID3(self.filename)
        dates = ["2013", "2014"]
        frame = TDEN(text=dates, encoding=3)
        audio.add(frame)
        tipl_frame = TIPL(people=[("a", "b"), ("c", "d")], encoding=2)
        audio.add(tipl_frame)
        audio.save(v2_version=3)

        id3 = ID3(self.filename, translate=False)
        self.assertEqual(id3.version, (2, 3, 0))

        self.assertEqual([stamp.text for stamp in id3["TDEN"].text], dates)
        self.assertEqual(id3["TDEN"].encoding, 1)

        self.assertEqual(id3["TIPL"].people, tipl_frame.people)
        self.assertEqual(id3["TIPL"].encoding, 1)

    def test_wrong_encoding(self):
        t = ID3(self.filename)
        t.add(TIT2(encoding=Encoding.LATIN1, text=[u"\u0243"]))
        self.assertRaises(MutagenError, t.save)

    def test_toemptyfile(self):
        t = ID3(self.filename)
        os.unlink(self.filename)
        open(self.filename, "wb").close()
        t.save(self.filename)

    def test_tononfile(self):
        t = ID3(self.filename)
        os.unlink(self.filename)
        t.save(self.filename)

    def test_1bfile(self):
        t = ID3(self.filename)
        os.unlink(self.filename)
        with open(self.filename, "wb") as f:
            f.write(b"!")
        t.save(self.filename)
        self.assert_(os.path.getsize(self.filename) > 1)
        with open(self.filename, "rb") as h:
            self.assertEquals(h.read()[-1], b"!"[0])

    def test_unknown_chap(self):
        # add ctoc
        id3 = ID3(self.filename)
        id3.add(CTOC(element_id="foo", flags=3, child_element_ids=["ch0"],
                     sub_frames=[TIT2(encoding=3, text=["bla"])]))
        id3.save()

        # pretend we don't know ctoc and save
        id3 = ID3(self.filename, known_frames={"CTOC": CTOC})
        ctoc = id3.getall("CTOC")[0]
        self.assertFalse(ctoc.sub_frames)
        self.assertTrue(ctoc.sub_frames.unknown_frames)
        id3.save()

        # make sure we wrote all sub frames back
        id3 = ID3(self.filename)
        self.assertEqual(
            id3.getall("CTOC")[0].sub_frames.getall("TIT2")[0].text, ["bla"])

    def test_same(self):
        ID3(self.filename).save()
        id3 = ID3(self.filename)
        self.assertEquals(id3["TALB"], "Quod Libet Test Data")
        self.assertEquals(id3["TCON"], "Silence")
        self.assertEquals(id3["TIT2"], "Silence")
        self.assertEquals(id3["TPE1"], ["piman", "jzig"])

    def test_same_v23(self):
        id3 = ID3(self.filename, v2_version=3)
        id3.save(v2_version=3)
        id3 = ID3(self.filename)
        self.assertEqual(id3.version, (2, 3, 0))
        self.assertEquals(id3["TALB"], "Quod Libet Test Data")
        self.assertEquals(id3["TCON"], "Silence")
        self.assertEquals(id3["TIT2"], "Silence")
        self.assertEquals(id3["TPE1"], "piman/jzig")

    def test_addframe(self):
        f = ID3(self.filename)
        self.assert_("TIT3" not in f)
        f["TIT3"] = TIT3(encoding=0, text="A subtitle!")
        f.save()
        id3 = ID3(self.filename)
        self.assertEquals(id3["TIT3"], "A subtitle!")

    def test_changeframe(self):
        f = ID3(self.filename)
        self.assertEquals(f["TIT2"], "Silence")
        f["TIT2"].text = [u"The sound of silence."]
        f.save()
        id3 = ID3(self.filename)
        self.assertEquals(id3["TIT2"], "The sound of silence.")

    def test_replaceframe(self):
        f = ID3(self.filename)
        self.assertEquals(f["TPE1"], [u'piman', u'jzig'])
        f["TPE1"] = TPE1(encoding=0, text=u"jzig\x00piman")
        f.save()
        id3 = ID3(self.filename)
        self.assertEquals(id3["TPE1"], ["jzig", "piman"])

    def test_compressibly_large(self):
        f = ID3(self.filename)
        self.assert_("TPE2" not in f)
        f["TPE2"] = TPE2(encoding=0, text="Ab" * 1025)
        f.save()
        id3 = ID3(self.filename)
        self.assertEquals(id3["TPE2"], "Ab" * 1025)

    def test_nofile_silencetag(self):
        id3 = ID3(self.filename)
        os.unlink(self.filename)
        id3.save(self.filename)
        with open(self.filename, 'rb') as h:
            self.assertEquals(b'ID3', h.read(3))
        self.test_same()

    def test_emptyfile_silencetag(self):
        id3 = ID3(self.filename)
        with open(self.filename, 'wb') as h:
            h.truncate()
        id3.save(self.filename)
        with open(self.filename, 'rb') as h:
            self.assertEquals(b'ID3', h.read(3))
        self.test_same()

    def test_empty_plustag_minustag_empty(self):
        id3 = ID3(self.filename)
        with open(self.filename, 'wb') as h:
            h.truncate()
        id3.save()
        id3.delete()
        self.failIf(id3)
        with open(self.filename, 'rb') as h:
            self.assertEquals(h.read(10), b'')

    def test_delete_invalid_zero(self):
        with open(self.filename, 'wb') as f:
            f.write(b'ID3\x04\x00\x00\x00\x00\x00\x00abc')
        ID3(self.filename).delete()
        with open(self.filename, 'rb') as f:
            self.assertEquals(f.read(10), b'abc')

    def test_frame_order(self):
        f = ID3(self.filename)
        f["TIT2"] = TIT2(encoding=0, text="A title!")
        f["APIC"] = APIC(encoding=0, mime="b", type=3, desc='', data=b"a")
        f["TALB"] = TALB(encoding=0, text="c")
        f["COMM"] = COMM(encoding=0, desc="x", text="y")
        f.save()
        with open(self.filename, 'rb') as h:
            data = h.read()
        self.assert_(data.find(b"TIT2") < data.find(b"APIC"))
        self.assert_(data.find(b"TIT2") < data.find(b"COMM"))
        self.assert_(data.find(b"TALB") < data.find(b"APIC"))
        self.assert_(data.find(b"TALB") < data.find(b"COMM"))
        self.assert_(data.find(b"TIT2") < data.find(b"TALB"))

    def test_apic_last(self):
        # https://github.com/quodlibet/mutagen/issues/278
        f = ID3(self.filename)
        f.add(TYER(text=[u"2016"]))
        f.add(APIC(data=b"x" * 500))
        f.save()
        with open(self.filename, 'rb') as h:
            data = h.read()
        assert data.find(b"TYER") < data.find(b"APIC")


class WriteForEyeD3(TestCase):

    def setUp(self):
        self.silence = os.path.join(DATA_DIR, 'silence-44-s.mp3')
        self.newsilence = get_temp_copy(self.silence)

        # remove ID3v1 tag
        with open(self.newsilence, "rb+") as f:
            f.seek(-128, 2)
            f.truncate()

    def tearDown(self):
        os.unlink(self.newsilence)

    def test_same(self):
        ID3(self.newsilence).save()
        id3 = eyeD3.tag.Tag(eyeD3.ID3_V2_4)
        id3.link(self.newsilence)

        self.assertEquals(id3.frames["TALB"][0].text, "Quod Libet Test Data")
        self.assertEquals(id3.frames["TCON"][0].text, "Silence")
        self.assertEquals(id3.frames["TIT2"][0].text, "Silence")
        self.assertEquals(len(id3.frames["TPE1"]), 1)
        self.assertEquals(id3.frames["TPE1"][0].text, "piman/jzig")

    def test_addframe(self):
        f = ID3(self.newsilence)
        self.assert_("TIT3" not in f)
        f["TIT3"] = TIT3(encoding=0, text="A subtitle!")
        f.save()
        id3 = eyeD3.tag.Tag(eyeD3.ID3_V2_4)
        id3.link(self.newsilence)
        self.assertEquals(id3.frames["TIT3"][0].text, "A subtitle!")

    def test_changeframe(self):
        f = ID3(self.newsilence)
        self.assertEquals(f["TIT2"], "Silence")
        f["TIT2"].text = [u"The sound of silence."]
        f.save()
        id3 = eyeD3.tag.Tag(eyeD3.ID3_V2_4)
        id3.link(self.newsilence)
        self.assertEquals(id3.frames["TIT2"][0].text, "The sound of silence.")


class BadPOPM(TestCase):

    def setUp(self):
        self.filename = get_temp_copy(
            os.path.join(DATA_DIR, 'bad-POPM-frame.mp3'))

    def tearDown(self):
        os.unlink(self.filename)

    def test_read_popm_long_counter(self):
        f = ID3(self.filename)
        self.failUnless("POPM:Windows Media Player 9 Series" in f)
        popm = f["POPM:Windows Media Player 9 Series"]
        self.assertEquals(popm.rating, 255)
        self.assertEquals(popm.count, 2709193061)

    def test_write_popm_long_counter(self):
        f = ID3(self.filename)
        f.add(POPM(email="foo@example.com", rating=125, count=2 ** 32 + 1))
        f.save()
        f = ID3(self.filename)
        self.failUnless("POPM:foo@example.com" in f)
        self.failUnless("POPM:Windows Media Player 9 Series" in f)
        popm = f["POPM:foo@example.com"]
        self.assertEquals(popm.rating, 125)
        self.assertEquals(popm.count, 2 ** 32 + 1)


class Issue69_BadV1Year(TestCase):

    def test_missing_year(self):
        tag = ParseID3v1(
            b'ABCTAGhello world\x00\x00\x00\x00\x00\x00\x00\x00'
            b'\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'
            b'x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'
            b'\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'
            b'x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'
            b'\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'
            b'\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'
            b'\x00\x00\x00\x00\x00\xff'
        )
        self.failUnlessEqual(tag["TIT2"], "hello world")

    def test_short_year(self):
        data = (
            b'XTAGhello world\x00\x00\x00\x00\x00\x00\x00\x00'
            b'\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'
            b'\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'
            b'\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'
            b'\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'
            b'\x00\x00\x00\x00\x00\x00\x001\x00\x00\x00\x00\x00\x00\x00\x00'
            b'\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00'
            b'\x00\x00\x00\x00\x00\x00\xff'
        )
        tag = ParseID3v1(data)
        self.failUnlessEqual(tag["TIT2"], "hello world")
        self.failUnlessEqual(tag["TDRC"], "0001")

        frames, offset = find_id3v1(cBytesIO(data))
        self.assertEqual(offset, -125)
        self.assertEqual(frames, tag)

    def test_none(self):
        s = MakeID3v1(dict())
        self.failUnlessEqual(len(s), 128)
        tag = ParseID3v1(s)
        self.failIf("TDRC" in tag)

    def test_empty(self):
        s = MakeID3v1(dict(TDRC=""))
        self.failUnlessEqual(len(s), 128)
        tag = ParseID3v1(s)
        self.failIf("TDRC" in tag)

    def test_short(self):
        s = MakeID3v1(dict(TDRC="1"))
        self.failUnlessEqual(len(s), 128)
        tag = ParseID3v1(s)
        self.failUnlessEqual(tag["TDRC"], "0001")

    def test_long(self):
        s = MakeID3v1(dict(TDRC="123456789"))
        self.failUnlessEqual(len(s), 128)
        tag = ParseID3v1(s)
        self.failUnlessEqual(tag["TDRC"], "1234")


class TID3Trailing(TestCase):

    def test_audacious_trailing_id3(self):
        # https://github.com/quodlibet/mutagen/issues/78
        # tagged with audacious 3.2.4, both are id3v2 at the end despite the
        # spec saying it should be before other tags.
        # Audacious changed it to write in the beginning with 3.4 or 3.5
        # Now with Audacious 3.7, re-saving the files results in the id3v3
        # tag moved to the front and the id3v1/apev2 tags left as is at the
        # end.
        path = os.path.join(DATA_DIR, 'audacious-trailing-id32-id31.mp3')
        self.assertRaises(ID3NoHeaderError, ID3, path)
        path = os.path.join(DATA_DIR, 'audacious-trailing-id32-apev2.mp3')
        self.assertRaises(ID3NoHeaderError, ID3, path)


class TID3Misc(TestCase):

    def test_main(self):
        self.assertEqual(id3.Encoding.UTF8, 3)
        self.assertEqual(id3.ID3v1SaveOptions.UPDATE, 1)
        self.assertEqual(id3.PictureType.COVER_FRONT, 3)

    def test_determine_bpi(self):
        # default to BitPaddedInt
        self.assertTrue(determine_bpi("", {}) is BitPaddedInt)

        def get_frame_data(name, size, bpi=True):
            data = name
            if bpi:
                data += BitPaddedInt.to_str(size)
            else:
                data += BitPaddedInt.to_str(size, bits=8)
            data += b"\x00\x00" + b"\x01" * size
            return data

        data = get_frame_data(b"TPE2", 1000, True)
        self.assertTrue(determine_bpi(data, Frames) is BitPaddedInt)
        self.assertTrue(
            determine_bpi(data + b"\x00" * 1000, Frames) is BitPaddedInt)

        data = get_frame_data(b"TPE2", 1000, False)
        self.assertTrue(determine_bpi(data, Frames) is int)
        self.assertTrue(determine_bpi(data + b"\x00" * 1000, Frames) is int)

        # in this case it helps that we know the frame name
        d = get_frame_data(b"TPE2", 1000) + get_frame_data(b"TPE2", 10) + \
            b"\x01" * 875
        self.assertTrue(determine_bpi(d, Frames) is BitPaddedInt)


try:
    import eyeD3
except ImportError:
    print("WARNING: Skipping eyeD3 tests.")
    del WriteForEyeD3
