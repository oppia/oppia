# -*- coding: utf-8 -*-

import os
from tempfile import mkstemp
import shutil
import locale

import mutagen
from mutagen.id3 import ID3
from mutagen._compat import PY2, PY3
from mutagen._senf import fsnative as fsn

from tests.test_tools import _TTools
from tests import DATA_DIR


class TMid3v2(_TTools):

    TOOL_NAME = u"mid3v2"

    def setUp(self):
        super(TMid3v2, self).setUp()
        original = os.path.join(DATA_DIR, fsn(u'silence-44-s.mp3'))
        fd, self.filename = mkstemp(suffix=fsn(u'öäü.mp3'))
        assert isinstance(self.filename, fsn)
        os.close(fd)
        shutil.copy(original, self.filename)

    def tearDown(self):
        super(TMid3v2, self).tearDown()
        os.unlink(self.filename)

    def test_no_tags(self):
        f = ID3(self.filename)
        f.delete()
        res, out, err = self.call2(fsn(u"-l"), self.filename)
        self.assertTrue("No ID3 header found" in out)

    def test_list_genres(self):
        for arg in [fsn(u"-L"), fsn(u"--list-genres")]:
            res, out = self.call(arg)
            self.failUnlessEqual(res, 0)
            self.failUnless("Acid Punk" in out)

    def test_list_frames(self):
        for arg in [fsn(u"-f"), fsn(u"--list-frames")]:
            res, out = self.call(arg)
            self.failUnlessEqual(res, 0)
            self.failUnless("--APIC" in out)
            self.failUnless("--TIT2" in out)

    def test_list(self):
        f = ID3(self.filename)
        album = f["TALB"].text[0]
        for arg in [fsn(u"-l"), fsn(u"--list")]:
            res, out = self.call(arg, self.filename)
            self.assertFalse("b'" in out)
            self.failUnlessEqual(res, 0)
            self.failUnless("TALB=" + fsn(album) in out)

    def test_list_raw(self):
        f = ID3(self.filename)
        res, out = self.call(fsn(u"--list-raw"), self.filename)
        self.failUnlessEqual(res, 0)
        self.failUnless(repr(f["TALB"]) in out)

    def _test_text_frame(self, short, longer, frame):
        new_value = fsn(u"TEST")
        for arg in [short, longer]:
            orig = ID3(self.filename)
            frame_class = mutagen.id3.Frames[frame]
            orig[frame] = frame_class(text=[u"BLAH"], encoding=3)
            orig.save()

            res, out = self.call(arg, new_value, self.filename)
            self.failUnlessEqual(res, 0)
            self.failIf(out)
            self.failUnlessEqual(ID3(self.filename)[frame].text, [new_value])

    def test_artist(self):
        self._test_text_frame(fsn(u"-a"), fsn(u"--artist"), "TPE1")

    def test_album(self):
        self._test_text_frame(fsn(u"-A"), fsn(u"--album"), "TALB")

    def test_title(self):
        self._test_text_frame(fsn(u"-t"), fsn(u"--song"), "TIT2")

    def test_genre(self):
        self._test_text_frame(fsn(u"-g"), fsn(u"--genre"), "TCON")

    def test_convert(self):
        res, out = self.call(fsn(u"--convert"), self.filename)
        self.failUnlessEqual((res, out), (0, ""))

    def test_artist_escape(self):
        res, out = self.call(
            fsn(u"-e"), fsn(u"-a"), fsn(u"foo\\nbar"), self.filename)
        self.failUnlessEqual(res, 0)
        self.failIf(out)
        f = ID3(self.filename)
        self.failUnlessEqual(f["TPE1"][0], "foo\nbar")

    def test_txxx_escape(self):
        res, out = self.call(
            fsn(u"-e"), fsn(u"--TXXX"),
            fsn(u"EscapeTest\\:\\:albumartist:Ex\\:ample"),
            self.filename)
        self.failUnlessEqual(res, 0)
        self.failIf(out)

        f = ID3(self.filename)
        frame = f.getall("TXXX")[0]
        self.failUnlessEqual(frame.desc, u"EscapeTest::albumartist")
        self.failUnlessEqual(frame.text, [u"Ex:ample"])

    def test_txxx(self):
        res, out = self.call(fsn(u"--TXXX"), fsn(u"A\\:B:C"), self.filename)
        self.failUnlessEqual((res, out), (0, ""))

        f = ID3(self.filename)
        frame = f.getall("TXXX")[0]
        self.failUnlessEqual(frame.desc, "A\\")
        self.failUnlessEqual(frame.text, ["B:C"])

    def test_ufid(self):
        res, out, err = self.call2(
            fsn(u"--UFID"), fsn(u"foo:bar"), self.filename)
        self.assertEqual((res, out, err), (0, "", ""))

        f = ID3(self.filename)
        frame = f.getall("UFID:foo")[0]
        self.assertEqual(frame.owner, u"foo")
        self.assertEqual(frame.data, b"bar")

    def test_comm1(self):
        res, out = self.call(fsn(u"--COMM"), fsn(u"A"), self.filename)
        self.failUnlessEqual((res, out), (0, ""))

        f = ID3(self.filename)
        frame = f.getall("COMM:")[0]
        self.failUnlessEqual(frame.desc, "")
        self.failUnlessEqual(frame.text, ["A"])

    def test_comm2(self):
        res, out = self.call(fsn(u"--COMM"), fsn(u"Y:B"), self.filename)
        self.failUnlessEqual((res, out), (0, ""))

        f = ID3(self.filename)
        frame = f.getall("COMM:Y")[0]
        self.failUnlessEqual(frame.desc, "Y")
        self.failUnlessEqual(frame.text, ["B"])

    def test_comm2_escape(self):
        res, out = self.call(
            fsn(u"-e"), fsn(u"--COMM"), fsn(u"Y\\:B\\nG"), self.filename)
        self.failUnlessEqual((res, out), (0, ""))

        f = ID3(self.filename)
        frame = f.getall("COMM:")[0]
        self.failUnlessEqual(frame.desc, "")
        self.failUnlessEqual(frame.text, ["Y:B\nG"])

    def test_comm3(self):
        res, out = self.call(
            fsn(u"--COMM"), fsn(u"Z:B:C:D:ger"), self.filename)
        self.failUnlessEqual((res, out), (0, ""))

        f = ID3(self.filename)
        frame = f.getall("COMM:Z")[0]
        self.failUnlessEqual(frame.desc, "Z")
        self.failUnlessEqual(frame.text, ["B:C:D"])
        self.failUnlessEqual(frame.lang, "ger")

    def test_apic(self):
        image_path = os.path.join(DATA_DIR, "image.jpg")
        image_path = os.path.relpath(image_path)
        res, out, err = self.call2(
            fsn(u"--APIC"), image_path + fsn(u":fooAPIC:3:image/jpeg"),
            self.filename)
        self.failUnlessEqual((res, out, err), (0, "", ""))

        with open(image_path, "rb") as h:
            data = h.read()

        f = ID3(self.filename)
        frame = f.getall("APIC:fooAPIC")[0]
        self.assertEqual(frame.desc, u"fooAPIC")
        self.assertEqual(frame.mime, "image/jpeg")
        self.assertEqual(frame.data, data)

        res, out = self.call(fsn(u"--list"), self.filename)
        self.assertEqual(res, 0)
        self.assertTrue("fooAPIC" in out)

    def test_encoding_with_escape(self):
        is_bytes = PY2 and os.name != "nt"

        text = u'\xe4\xf6\xfc'
        if is_bytes:
            enc = locale.getpreferredencoding()
            # don't fail in case getpreferredencoding doesn't give us a unicode
            # encoding.
            text = text.encode(enc, "replace")
        res, out = self.call(fsn(u"-e"), fsn(u"-a"), text, self.filename)
        self.failUnlessEqual((res, out), (0, ""))
        f = ID3(self.filename)
        if is_bytes:
            text = text.decode(enc)
        self.assertEqual(f.getall("TPE1")[0], text)

    def test_invalid_encoding_escaped(self):
        res, out, err = self.call2(
            fsn(u"--TALB"), fsn(u'\\xff\\x81'), fsn(u'-e'), self.filename)
        self.failIfEqual(res, 0)
        self.failUnless("TALB" in err)

    def test_invalid_encoding(self):
        if os.name == "nt":
            return

        value = b"\xff\xff\x81"
        self.assertRaises(ValueError, value.decode, "utf-8")
        self.assertRaises(ValueError, value.decode, "cp1252")
        enc = locale.getpreferredencoding()

        # we need the decoding to fail for this test to work...
        try:
            value.decode(enc)
        except ValueError:
            pass
        else:
            return

        if not PY2:
            value = value.decode(enc, "surrogateescape")
        res, out, err = self.call2("--TALB", value, self.filename)
        self.failIfEqual(res, 0)
        self.failUnless("TALB" in err)

    def test_invalid_escape(self):
        res, out, err = self.call2(
            fsn(u"--TALB"), fsn(u'\\xaz'), fsn(u'-e'), self.filename)
        self.failIfEqual(res, 0)
        self.failUnless("TALB" in err)

        res, out, err = self.call2(
            fsn(u"--TALB"), fsn(u'\\'), fsn(u'-e'), self.filename)
        self.failIfEqual(res, 0)
        self.failUnless("TALB" in err)

    def test_value_from_fsnative(self):
        vffs = self.get_var("value_from_fsnative")
        self.assertEqual(vffs(fsn(u"öäü\\n"), True), u"öäü\n")
        self.assertEqual(vffs(fsn(u"öäü\\n"), False), u"öäü\\n")

        if os.name != "nt" and PY3:
            se = b"\xff".decode("utf-8", "surrogateescape")
            self.assertRaises(ValueError, vffs, se, False)

    def test_frame_from_fsnative(self):
        fffs = self.get_var("frame_from_fsnative")
        self.assertTrue(isinstance(fffs(fsn(u"abc")), str))
        self.assertEqual(fffs(fsn(u"abc")), "abc")
        self.assertRaises(ValueError, fffs, fsn(u"öäü"))
