# -*- coding: utf-8 -*-
# FIXME: This test suite is a mess, a lot of it dates from PyMusepack so
# it doesn't match the other Mutagen test conventions/quality.

import os
import shutil

from tests import TestCase, DATA_DIR, get_temp_copy

import mutagen.apev2
from mutagen import MutagenError
from mutagen._compat import PY3, text_type, izip, xrange
from mutagen.apev2 import APEv2File, APEv2, is_valid_apev2_key, \
    APEBadItemError, error as APEv2Error


SAMPLE = os.path.join(DATA_DIR, "click.mpc")
OLD = os.path.join(DATA_DIR, "oldtag.apev2")
BROKEN = os.path.join(DATA_DIR, "brokentag.apev2")
LYRICS2 = os.path.join(DATA_DIR, "apev2-lyricsv2.mp3")
INVAL_ITEM_COUNT = os.path.join(DATA_DIR, "145-invalid-item-count.apev2")


class Tis_valid_apev2_key(TestCase):

    def test_yes(self):
        for key in ["foo", "Foo", "   f ~~~"]:
            self.failUnless(is_valid_apev2_key(key))

    def test_no(self):
        for key in ["\x11hi", "ffoo\xFF", u"\u1234", "a", "", "foo" * 100]:
            self.failIf(is_valid_apev2_key(key))

    if PY3:
        def test_py3(self):
            self.assertRaises(TypeError, is_valid_apev2_key, b"abc")


class TAPEInvalidItemCount(TestCase):
    # https://github.com/quodlibet/mutagen/issues/145

    def test_load(self):
        x = mutagen.apev2.APEv2(INVAL_ITEM_COUNT)
        self.failUnlessEqual(len(x.keys()), 17)


class TAPEWriter(TestCase):
    offset = 0

    def setUp(self):
        shutil.copy(SAMPLE, SAMPLE + ".new")
        shutil.copy(BROKEN, BROKEN + ".new")
        tag = mutagen.apev2.APEv2()
        self.values = {"artist": "Joe Wreschnig\0unittest",
                       "album": "Mutagen tests",
                       "title": "Not really a song"}
        for k, v in self.values.items():
            tag[k] = v
        tag.save(SAMPLE + ".new")
        tag.save(SAMPLE + ".justtag")
        tag.save(SAMPLE + ".tag_at_start")
        fileobj = open(SAMPLE + ".tag_at_start", "ab")
        fileobj.write(b"tag garbage" * 1000)
        fileobj.close()
        self.tag = mutagen.apev2.APEv2(SAMPLE + ".new")

    def test_changed(self):
        size = os.path.getsize(SAMPLE + ".new")
        self.tag.save()
        self.failUnlessEqual(
            os.path.getsize(SAMPLE + ".new"), size - self.offset)

    def test_fix_broken(self):
        # Clean up garbage from a bug in pre-Mutagen APEv2.
        # This also tests removing ID3v1 tags on writes.
        self.failIfEqual(os.path.getsize(OLD), os.path.getsize(BROKEN))
        tag = mutagen.apev2.APEv2(BROKEN)
        tag.save(BROKEN + ".new")
        self.failUnlessEqual(
            os.path.getsize(OLD), os.path.getsize(BROKEN + ".new"))

    def test_readback(self):
        for k, v in self.tag.items():
            self.failUnlessEqual(str(v), self.values[k])

    def test_size(self):
        self.failUnlessEqual(
            os.path.getsize(SAMPLE + ".new"),
            os.path.getsize(SAMPLE) + os.path.getsize(SAMPLE + ".justtag"))

    def test_delete(self):
        mutagen.apev2.delete(SAMPLE + ".justtag")
        tag = mutagen.apev2.APEv2(SAMPLE + ".new")
        tag.delete()
        self.failUnlessEqual(os.path.getsize(SAMPLE + ".justtag"), self.offset)
        self.failUnlessEqual(os.path.getsize(SAMPLE) + self.offset,
                             os.path.getsize(SAMPLE + ".new"))
        self.failIf(tag)

    def test_empty(self):
        self.failUnlessRaises(
            APEv2Error, mutagen.apev2.APEv2,
            os.path.join(DATA_DIR, "emptyfile.mp3"))

    def test_tag_at_start(self):
        filename = SAMPLE + ".tag_at_start"
        tag = mutagen.apev2.APEv2(filename)
        self.failUnlessEqual(tag["album"], "Mutagen tests")

    def test_tag_at_start_write(self):
        filename = SAMPLE + ".tag_at_start"
        tag = mutagen.apev2.APEv2(filename)
        tag.save()
        tag = mutagen.apev2.APEv2(filename)
        self.failUnlessEqual(tag["album"], "Mutagen tests")
        self.failUnlessEqual(
            os.path.getsize(SAMPLE + ".justtag"),
            os.path.getsize(filename) - (len("tag garbage") * 1000))

    def test_tag_at_start_delete(self):
        filename = SAMPLE + ".tag_at_start"
        tag = mutagen.apev2.APEv2(filename)
        tag.delete()
        self.failUnlessRaises(APEv2Error, mutagen.apev2.APEv2, filename)
        self.failUnlessEqual(
            os.path.getsize(filename), len("tag garbage") * 1000)

    def test_case_preservation(self):
        mutagen.apev2.delete(SAMPLE + ".justtag")
        tag = mutagen.apev2.APEv2(SAMPLE + ".new")
        tag["FoObaR"] = "Quux"
        tag.save()
        tag = mutagen.apev2.APEv2(SAMPLE + ".new")
        self.failUnless("FoObaR" in tag.keys())
        self.failIf("foobar" in tag.keys())

    def test_unicode_key(self):
        # https://github.com/quodlibet/mutagen/issues/123
        tag = mutagen.apev2.APEv2(SAMPLE + ".new")
        tag["abc"] = u'\xf6\xe4\xfc'
        tag[u"cba"] = "abc"
        tag.save()

    def tearDown(self):
        os.unlink(SAMPLE + ".new")
        os.unlink(BROKEN + ".new")
        os.unlink(SAMPLE + ".justtag")
        os.unlink(SAMPLE + ".tag_at_start")


class TAPEv2ThenID3v1Writer(TAPEWriter):
    offset = 128

    def setUp(self):
        super(TAPEv2ThenID3v1Writer, self).setUp()
        f = open(SAMPLE + ".new", "ab+")
        f.write(b"TAG" + b"\x00" * 125)
        f.close()
        f = open(BROKEN + ".new", "ab+")
        f.write(b"TAG" + b"\x00" * 125)
        f.close()
        f = open(SAMPLE + ".justtag", "ab+")
        f.write(b"TAG" + b"\x00" * 125)
        f.close()

    def test_tag_at_start_write(self):
        pass


class TAPEv2(TestCase):

    def setUp(self):
        self.filename = get_temp_copy(OLD)
        self.audio = APEv2(self.filename)

    def tearDown(self):
        os.unlink(self.filename)

    def test_invalid_key(self):
        self.failUnlessRaises(
            KeyError, self.audio.__setitem__, u"\u1234", "foo")

    def test_guess_text(self):
        from mutagen.apev2 import APETextValue
        self.audio["test"] = u"foobar"
        self.failUnlessEqual(self.audio["test"], "foobar")
        self.failUnless(isinstance(self.audio["test"], APETextValue))

    def test_guess_text_list(self):
        from mutagen.apev2 import APETextValue
        self.audio["test"] = [u"foobar", "quuxbarz"]
        self.failUnlessEqual(self.audio["test"], "foobar\x00quuxbarz")
        self.failUnless(isinstance(self.audio["test"], APETextValue))

    def test_guess_utf8(self):
        from mutagen.apev2 import APETextValue
        self.audio["test"] = "foobar"
        self.failUnlessEqual(self.audio["test"], "foobar")
        self.failUnless(isinstance(self.audio["test"], APETextValue))

    def test_guess_not_utf8(self):
        from mutagen.apev2 import APEBinaryValue
        self.audio["test"] = b"\xa4woo"
        self.failUnless(isinstance(self.audio["test"], APEBinaryValue))
        self.failUnlessEqual(4, len(self.audio["test"]))

    def test_bad_value_type(self):
        from mutagen.apev2 import APEValue
        self.failUnlessRaises(ValueError, APEValue, "foo", 99)

    def test_module_delete_empty(self):
        from mutagen.apev2 import delete
        delete(os.path.join(DATA_DIR, "emptyfile.mp3"))

    def test_invalid(self):
        self.failUnlessRaises(MutagenError, mutagen.apev2.APEv2, "dne")

    def test_no_tag(self):
        self.failUnlessRaises(MutagenError, mutagen.apev2.APEv2,
                              os.path.join(DATA_DIR, "empty.mp3"))

    def test_cases(self):
        self.failUnlessEqual(self.audio["artist"], self.audio["ARTIST"])
        self.failUnless("artist" in self.audio)
        self.failUnless("artisT" in self.audio)

    def test_keys(self):
        self.failUnless("Track" in self.audio.keys())
        self.failUnless("AnArtist" in self.audio.values())

        self.failUnlessEqual(
            self.audio.items(),
            list(izip(self.audio.keys(), self.audio.values())))

    def test_key_type(self):
        key = self.audio.keys()[0]
        if PY3:
            self.assertTrue(isinstance(key, text_type))
        else:
            self.assertTrue(isinstance(key, bytes))

    def test_invalid_keys(self):
        self.failUnlessRaises(KeyError, self.audio.__getitem__, "\x00")
        self.failUnlessRaises(KeyError, self.audio.__setitem__, "\x00", "")
        self.failUnlessRaises(KeyError, self.audio.__delitem__, "\x00")

    def test_dictlike(self):
        self.failUnless(self.audio.get("track"))
        self.failUnless(self.audio.get("Track"))

    def test_del(self):
        s = self.audio["artist"]
        del(self.audio["artist"])
        self.failIf("artist" in self.audio)
        self.failUnlessRaises(KeyError, self.audio.__getitem__, "artist")
        self.audio["Artist"] = s
        self.failUnlessEqual(self.audio["artist"], "AnArtist")

    def test_values(self):
        self.failUnlessEqual(self.audio["artist"], self.audio["artist"])
        self.failUnless(self.audio["artist"] < self.audio["title"])
        self.failUnlessEqual(self.audio["artist"], "AnArtist")
        self.failUnlessEqual(self.audio["title"], "Some Music")
        self.failUnlessEqual(self.audio["album"], "A test case")
        self.failUnlessEqual("07", self.audio["track"])

        self.failIfEqual(self.audio["album"], "A test Case")

    def test_pprint(self):
        self.failUnless(self.audio.pprint())


class TAPEv2ThenID3v1(TAPEv2):

    def setUp(self):
        super(TAPEv2ThenID3v1, self).setUp()
        f = open(self.filename, "ab+")
        f.write(b"TAG" + b"\x00" * 125)
        f.close()
        self.audio = APEv2(self.filename)


class TAPEv2WithLyrics2(TestCase):

    def setUp(self):
        self.tag = mutagen.apev2.APEv2(LYRICS2)

    def test_values(self):
        self.failUnlessEqual(self.tag["MP3GAIN_MINMAX"], "000,179")
        self.failUnlessEqual(self.tag["REPLAYGAIN_TRACK_GAIN"], "-4.080000 dB")
        self.failUnlessEqual(self.tag["REPLAYGAIN_TRACK_PEAK"], "1.008101")


class TAPEBinaryValue(TestCase):

    from mutagen.apev2 import APEBinaryValue as BV
    BV = BV

    def setUp(self):
        self.sample = b"\x12\x45\xde"
        self.value = mutagen.apev2.APEValue(self.sample, mutagen.apev2.BINARY)

    def test_type(self):
        self.failUnless(isinstance(self.value, self.BV))

    def test_const(self):
        self.failUnlessEqual(self.sample, bytes(self.value))

    def test_repr(self):
        repr(self.value)

    def test_pprint(self):
        self.assertEqual(self.value.pprint(), "[3 bytes]")

    def test_type2(self):
        self.assertRaises(TypeError,
                          mutagen.apev2.APEValue, u"abc", mutagen.apev2.BINARY)


class TAPETextValue(TestCase):

    from mutagen.apev2 import APETextValue as TV
    TV = TV

    def setUp(self):
        self.sample = ["foo", "bar", "baz"]
        self.value = mutagen.apev2.APEValue(
            "\0".join(self.sample), mutagen.apev2.TEXT)

    def test_parse(self):
        self.assertRaises(APEBadItemError, self.TV._new, b"\xff")

    def test_type(self):
        self.failUnless(isinstance(self.value, self.TV))

    def test_construct(self):
        self.assertEqual(text_type(self.TV(u"foo")), u"foo")
        if not PY3:
            self.assertEqual(text_type(self.TV(b"foo")), u"foo")
            self.assertRaises(ValueError, self.TV, b"\xff")

    def test_list(self):
        self.failUnlessEqual(self.sample, list(self.value))

    def test_setitem_list(self):
        self.value[2] = self.sample[2] = 'quux'
        self.test_list()
        self.test_getitem()
        self.value[2] = self.sample[2] = 'baz'

    def test_getitem(self):
        for i in xrange(len(self.value)):
            self.failUnlessEqual(self.sample[i], self.value[i])

    def test_delitem(self):
        del self.sample[1]
        self.assertEqual(list(self.sample), ["foo", "baz"])
        del self.sample[1:]
        self.assertEqual(list(self.sample), ["foo"])

    def test_insert(self):
        self.sample.insert(0, "a")
        self.assertEqual(len(self.sample), 4)
        self.assertEqual(self.sample[0], "a")
        if PY3:
            self.assertRaises(TypeError, self.value.insert, 2, b"abc")

    def test_types(self):
        if PY3:
            self.assertRaises(TypeError, self.value.__setitem__, 2, b"abc")
            self.assertRaises(
                TypeError, mutagen.apev2.APEValue, b"abc", mutagen.apev2.TEXT)

    def test_repr(self):
        repr(self.value)

    def test_str(self):
        self.assertEqual(text_type(self.value), u"foo\x00bar\x00baz")

    def test_pprint(self):
        self.assertEqual(self.value.pprint(), "foo / bar / baz")


class TAPEExtValue(TestCase):

    from mutagen.apev2 import APEExtValue as EV
    EV = EV

    def setUp(self):
        self.sample = "http://foo"
        self.value = mutagen.apev2.APEValue(
            self.sample, mutagen.apev2.EXTERNAL)

    def test_type(self):
        self.failUnless(isinstance(self.value, self.EV))

    def test_const(self):
        self.failUnlessEqual(self.sample, self.value)

    def test_repr(self):
        repr(self.value)

    if PY3:
        def test_py3(self):
            self.assertRaises(
                TypeError, mutagen.apev2.APEValue, b"abc",
                mutagen.apev2.EXTERNAL)

    def test_pprint(self):
        self.assertEqual(self.value.pprint(), "[External] http://foo")


class TAPEv2File(TestCase):

    def setUp(self):
        self.audio = APEv2File(os.path.join(DATA_DIR, "click.mpc"))

    def test_empty(self):
        f = APEv2File(os.path.join(DATA_DIR, "xing.mp3"))
        self.assertFalse(f.items())

    def test_add_tags(self):
        self.failUnless(self.audio.tags is None)
        self.audio.add_tags()
        self.failUnless(self.audio.tags is not None)
        self.failUnlessRaises(APEv2Error, self.audio.add_tags)

    def test_unknown_info(self):
        info = self.audio.info
        info.pprint()
