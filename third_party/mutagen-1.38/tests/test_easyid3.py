# -*- coding: utf-8 -*-

import os
import pickle

from mutagen import MutagenError
from mutagen.id3 import ID3FileType, ID3, RVA2, CHAP, TDRC, CTOC
from mutagen.easyid3 import EasyID3, error as ID3Error
from mutagen._compat import PY3

from tests import TestCase, DATA_DIR, get_temp_copy


class TEasyID3(TestCase):

    def setUp(self):
        self.filename = get_temp_copy(os.path.join(DATA_DIR, 'emptyfile.mp3'))
        self.id3 = EasyID3()
        self.realid3 = self.id3._EasyID3__id3

    def tearDown(self):
        os.unlink(self.filename)

    def test_load_filename(self):
        self.id3.save(self.filename)
        self.id3.load(self.filename)
        assert self.id3.filename == self.filename

        path = os.path.join(DATA_DIR, 'silence-44-s.mp3')
        new = EasyID3(path)
        assert new.filename == path

    def test_txxx_latin_first_then_non_latin(self):
        self.id3["performer"] = [u"foo"]
        self.id3["performer"] = [u"\u0243"]
        self.id3.save(self.filename)
        new = EasyID3(self.filename)
        self.assertEqual(new["performer"], [u"\u0243"])

    def test_remember_ctr(self):
        empty = os.path.join(DATA_DIR, 'emptyfile.mp3')
        mp3 = ID3FileType(empty, ID3=EasyID3)
        self.failIf(mp3.tags)
        mp3["artist"] = ["testing"]
        self.failUnless(mp3.tags)
        mp3.pprint()
        self.failUnless(isinstance(mp3.tags, EasyID3))

    def test_save_23(self):
        self.id3.save(self.filename, v2_version=3)
        self.assertEqual(ID3(self.filename).version, (2, 3, 0))
        self.id3.save(self.filename, v2_version=4)
        self.assertEqual(ID3(self.filename).version, (2, 4, 0))

    def test_save_date_v23(self):
        self.id3["date"] = "2004"
        assert self.realid3.getall("TDRC")[0] == u"2004"
        self.id3.save(self.filename, v2_version=3)
        assert self.realid3.getall("TDRC")[0] == u"2004"
        assert not self.realid3.getall("TYER")
        new = ID3(self.filename, translate=False)
        assert new.version == (2, 3, 0)
        assert new.getall("TYER")[0] == u"2004"

    def test_save_v23_error_restore(self):
        self.id3["date"] = "2004"
        with self.assertRaises(MutagenError):
            self.id3.save("", v2_version=3)
        assert self.id3["date"] == ["2004"]

    def test_save_v23_recurse_restore(self):
        self.realid3.add(CHAP(sub_frames=[TDRC(text="2006")]))
        self.realid3.add(CTOC(sub_frames=[TDRC(text="2006")]))
        self.id3.save(self.filename, v2_version=3)

        for frame_id in ["CHAP", "CTOC"]:
            chap = self.realid3.getall(frame_id)[0]
            assert chap.sub_frames.getall("TDRC")[0] == "2006"
            new = ID3(self.filename, translate=False)
            assert new.version == (2, 3, 0)
            chap = new.getall(frame_id)[0]
            assert not chap.sub_frames.getall("TDRC")
            assert chap.sub_frames.getall("TYER")[0] == "2006"

    def test_delete(self):
        self.id3["artist"] = "foobar"
        self.id3.save(self.filename)
        self.failUnless(os.path.getsize(self.filename))
        self.id3.delete(self.filename)
        self.failIf(os.path.getsize(self.filename))
        self.failIf(self.id3)

    def test_pprint(self):
        self.id3["artist"] = "baz"
        self.id3.pprint()

    def test_in(self):
        self.failIf("foo" in self.id3)

    if not PY3:
        def test_has_key(self):
            self.failIf(self.id3.has_key("foo"))

    def test_empty_file(self):
        empty = os.path.join(DATA_DIR, 'emptyfile.mp3')
        self.assertRaises(ID3Error, EasyID3, filename=empty)

    def test_nonexistent_file(self):
        empty = os.path.join(DATA_DIR, 'does', 'not', 'exist')
        self.assertRaises(MutagenError, EasyID3, filename=empty)

    def test_write_single(self):
        for key in EasyID3.valid_keys:
            if (key == "date") or (key == "originaldate"):
                continue
            elif key.startswith("replaygain_"):
                continue

            # Test creation
            self.id3[key] = "a test value"
            self.id3.save(self.filename)
            id3 = EasyID3(self.filename)
            self.failUnlessEqual(id3[key], ["a test value"])
            self.failUnlessEqual(id3.keys(), [key])

            # And non-creation setting.
            self.id3[key] = "a test value"
            self.id3.save(self.filename)
            id3 = EasyID3(self.filename)
            self.failUnlessEqual(id3[key], ["a test value"])
            self.failUnlessEqual(id3.keys(), [key])

            del(self.id3[key])

    def test_write_double(self):
        for key in EasyID3.valid_keys:
            if (key == "date") or (key == "originaldate"):
                continue
            elif key.startswith("replaygain_"):
                continue
            elif key == "musicbrainz_trackid":
                continue

            self.id3[key] = ["a test", "value"]
            self.id3.save(self.filename)
            id3 = EasyID3(self.filename)
            # some keys end up in multiple frames and ID3.getall returns
            # them in undefined order
            self.failUnlessEqual(sorted(id3.get(key)), ["a test", "value"])
            self.failUnlessEqual(id3.keys(), [key])

            self.id3[key] = ["a test", "value"]
            self.id3.save(self.filename)
            id3 = EasyID3(self.filename)
            self.failUnlessEqual(sorted(id3.get(key)), ["a test", "value"])
            self.failUnlessEqual(id3.keys(), [key])

            del(self.id3[key])

    def test_write_date(self):
        self.id3["date"] = "2004"
        self.id3.save(self.filename)
        id3 = EasyID3(self.filename)
        self.failUnlessEqual(id3["date"], ["2004"])

        self.id3["date"] = "2004"
        self.id3.save(self.filename)
        id3 = EasyID3(self.filename)
        self.failUnlessEqual(id3["date"], ["2004"])

    def test_date_delete(self):
        self.id3["date"] = "2004"
        self.failUnlessEqual(self.id3["date"], ["2004"])
        del(self.id3["date"])
        self.failIf("date" in self.id3.keys())

    def test_write_date_double(self):
        self.id3["date"] = ["2004", "2005"]
        self.id3.save(self.filename)
        id3 = EasyID3(self.filename)
        self.failUnlessEqual(id3["date"], ["2004", "2005"])

        self.id3["date"] = ["2004", "2005"]
        self.id3.save(self.filename)
        id3 = EasyID3(self.filename)
        self.failUnlessEqual(id3["date"], ["2004", "2005"])

    def test_write_original_date(self):
        self.id3["originaldate"] = "2004"
        self.id3.save(self.filename)
        id3 = EasyID3(self.filename)
        self.failUnlessEqual(id3["originaldate"], ["2004"])

        self.id3["originaldate"] = "2004"
        self.id3.save(self.filename)
        id3 = EasyID3(self.filename)
        self.failUnlessEqual(id3["originaldate"], ["2004"])

    def test_original_date_delete(self):
        self.id3["originaldate"] = "2004"
        self.failUnlessEqual(self.id3["originaldate"], ["2004"])
        del(self.id3["originaldate"])
        self.failIf("originaldate" in self.id3.keys())

    def test_write_original_date_double(self):
        self.id3["originaldate"] = ["2004", "2005"]
        self.id3.save(self.filename)
        id3 = EasyID3(self.filename)
        self.failUnlessEqual(id3["originaldate"], ["2004", "2005"])

        self.id3["originaldate"] = ["2004", "2005"]
        self.id3.save(self.filename)
        id3 = EasyID3(self.filename)
        self.failUnlessEqual(id3["originaldate"], ["2004", "2005"])

    def test_write_invalid(self):
        self.failUnlessRaises(ValueError, self.id3.__getitem__, "notvalid")
        self.failUnlessRaises(ValueError, self.id3.__delitem__, "notvalid")
        self.failUnlessRaises(
            ValueError, self.id3.__setitem__, "notvalid", "tests")

    def test_perfomer(self):
        self.id3["performer:coder"] = ["piman", "mu"]
        self.id3.save(self.filename)
        id3 = EasyID3(self.filename)
        self.failUnlessEqual(id3["performer:coder"], ["piman", "mu"])

    def test_no_performer(self):
        self.failIf("performer:foo" in self.id3)

    def test_performer_delete(self):
        self.id3["performer:foo"] = "Joe"
        self.id3["performer:bar"] = "Joe"
        self.failUnless("performer:foo" in self.id3)
        self.failUnless("performer:bar" in self.id3)
        del(self.id3["performer:foo"])
        self.failIf("performer:foo" in self.id3)
        self.failUnless("performer:bar" in self.id3)
        del(self.id3["performer:bar"])
        self.failIf("performer:bar" in self.id3)
        self.failIf("TMCL" in self.realid3)

    def test_performer_delete_dne(self):
        self.failUnlessRaises(KeyError, self.id3.__delitem__, "performer:bar")
        self.id3["performer:foo"] = "Joe"
        self.failUnlessRaises(KeyError, self.id3.__delitem__, "performer:bar")

    def test_txxx_empty(self):
        # https://github.com/quodlibet/mutagen/issues/135
        self.id3["asin"] = ""

    def test_txxx_set_get(self):
        self.failIf("asin" in self.id3.keys())
        self.id3["asin"] = "Hello"
        self.failUnless("asin" in self.id3.keys())
        self.failUnlessEqual(self.id3["asin"], ["Hello"])
        self.failUnless("TXXX:ASIN" in self.realid3)

    def test_txxx_del_set_del(self):
        self.failIf("asin" in self.id3.keys())
        self.failUnlessRaises(KeyError, self.id3.__delitem__, "asin")
        self.id3["asin"] = "Hello"
        self.failUnless("asin" in self.id3.keys())
        self.failUnlessEqual(self.id3["asin"], ["Hello"])
        del(self.id3["asin"])
        self.failIf("asin" in self.id3.keys())
        self.failUnlessRaises(KeyError, self.id3.__delitem__, "asin")

    def test_txxx_save(self):
        self.id3["asin"] = "Hello"
        self.id3.save(self.filename)
        id3 = EasyID3(self.filename)
        self.failUnlessEqual(id3["asin"], ["Hello"])

    def test_txxx_unicode(self):
        self.id3["asin"] = u"He\u1234llo"
        self.failUnlessEqual(self.id3["asin"], [u"He\u1234llo"])

    def test_bad_trackid(self):
        self.failUnlessRaises(ValueError, self.id3.__setitem__,
                              "musicbrainz_trackid", ["a", "b"])
        self.failIf(self.realid3.getall("RVA2"))

    def test_gain_bad_key(self):
        self.failIf("replaygain_foo_gain" in self.id3)
        self.failIf(self.realid3.getall("RVA2"))

    def test_gain_bad_value(self):
        self.failUnlessRaises(
            ValueError, self.id3.__setitem__, "replaygain_foo_gain", [])
        self.failUnlessRaises(
            ValueError, self.id3.__setitem__, "replaygain_foo_gain", ["foo"])
        self.failUnlessRaises(
            ValueError,
            self.id3.__setitem__, "replaygain_foo_gain", ["1", "2"])
        self.failIf(self.realid3.getall("RVA2"))

    def test_peak_bad_key(self):
        self.failIf("replaygain_foo_peak" in self.id3)
        self.failIf(self.realid3.getall("RVA2"))

    def test_peak_bad_value(self):
        self.failUnlessRaises(
            ValueError, self.id3.__setitem__, "replaygain_foo_peak", [])
        self.failUnlessRaises(
            ValueError, self.id3.__setitem__, "replaygain_foo_peak", ["foo"])
        self.failUnlessRaises(
            ValueError,
            self.id3.__setitem__, "replaygain_foo_peak", ["1", "1"])
        self.failUnlessRaises(
            ValueError, self.id3.__setitem__, "replaygain_foo_peak", ["3"])
        self.failIf(self.realid3.getall("RVA2"))

    def test_gain_peak_get(self):
        self.id3["replaygain_foo_gain"] = "+3.5 dB"
        self.id3["replaygain_bar_peak"] = "0.5"
        self.failUnlessEqual(
            self.id3["replaygain_foo_gain"], ["+3.500000 dB"])
        self.failUnlessEqual(self.id3["replaygain_foo_peak"], ["0.000000"])
        self.failUnlessEqual(
            self.id3["replaygain_bar_gain"], ["+0.000000 dB"])
        self.failUnlessEqual(self.id3["replaygain_bar_peak"], ["0.500000"])

    def test_gain_peak_set(self):
        self.id3["replaygain_foo_gain"] = "+3.5 dB"
        self.id3["replaygain_bar_peak"] = "0.5"
        self.id3.save(self.filename)
        id3 = EasyID3(self.filename)
        self.failUnlessEqual(id3["replaygain_foo_gain"], ["+3.500000 dB"])
        self.failUnlessEqual(id3["replaygain_foo_peak"], ["0.000000"])
        self.failUnlessEqual(id3["replaygain_bar_gain"], ["+0.000000 dB"])
        self.failUnlessEqual(id3["replaygain_bar_peak"], ["0.500000"])

    def test_gain_peak_delete(self):
        self.id3["replaygain_foo_gain"] = "+3.5 dB"
        self.id3["replaygain_bar_peak"] = "0.5"
        del(self.id3["replaygain_bar_gain"])
        del(self.id3["replaygain_foo_peak"])
        self.failUnless("replaygain_foo_gain" in self.id3.keys())
        self.failUnless("replaygain_bar_gain" in self.id3.keys())

        del(self.id3["replaygain_foo_gain"])
        del(self.id3["replaygain_bar_peak"])
        self.failIf("replaygain_foo_gain" in self.id3.keys())
        self.failIf("replaygain_bar_gain" in self.id3.keys())

        del(self.id3["replaygain_foo_gain"])
        del(self.id3["replaygain_bar_peak"])
        self.failIf("replaygain_foo_gain" in self.id3.keys())
        self.failIf("replaygain_bar_gain" in self.id3.keys())

    def test_gain_peak_capitalization(self):
        frame = RVA2(desc=u"Foo", gain=1.0, peak=1.0, channel=0)
        self.assertFalse(len(self.realid3))
        self.realid3.add(frame)
        self.assertTrue("replaygain_Foo_peak" in self.id3)
        self.assertTrue("replaygain_Foo_peak" in self.id3.keys())
        self.assertTrue("replaygain_Foo_gain" in self.id3)
        self.assertTrue("replaygain_Foo_gain" in self.id3.keys())

        self.id3["replaygain_Foo_gain"] = ["0.5"]
        self.id3["replaygain_Foo_peak"] = ["0.25"]

        frames = self.realid3.getall("RVA2")
        self.assertEqual(len(frames), 1)
        self.assertEqual(frames[0].desc, u"Foo")
        self.assertEqual(frames[0].gain, 0.5)
        self.assertEqual(frames[0].peak, 0.25)

    def test_case_insensitive(self):
        self.id3["date"] = [u"2004"]
        self.assertEqual(self.id3["DATE"], [u"2004"])
        del self.id3["DaTe"]
        self.assertEqual(len(self.id3), 0)

        self.id3["asin"] = [u"foo"]
        self.assertEqual(self.id3["Asin"], [u"foo"])
        del self.id3["AsIn"]
        self.assertEqual(len(self.id3), 0)

    def test_pickle(self):
        # https://github.com/quodlibet/mutagen/issues/102
        pickle.dumps(self.id3)

    def test_get_fallback(self):
        called = []

        def get_func(id3, key):
            id3.getall("")
            self.failUnlessEqual(key, "nope")
            called.append(1)
        self.id3.GetFallback = get_func
        self.id3["nope"]
        self.failUnless(called)

    def test_set_fallback(self):
        called = []

        def set_func(id3, key, value):
            id3.getall("")
            self.failUnlessEqual(key, "nope")
            self.failUnlessEqual(value, ["foo"])
            called.append(1)
        self.id3.SetFallback = set_func
        self.id3["nope"] = "foo"
        self.failUnless(called)

    def test_del_fallback(self):
        called = []

        def del_func(id3, key):
            id3.getall("")
            self.failUnlessEqual(key, "nope")
            called.append(1)
        self.id3.DeleteFallback = del_func
        del self.id3["nope"]
        self.failUnless(called)

    def test_list_fallback(self):
        def list_func(id3, key):
            id3.getall("")
            self.failIf(key)
            return ["somekey"]

        self.id3.ListFallback = list_func
        self.failUnlessEqual(self.id3.keys(), ["somekey"])

    def test_text_tags(self):
        for tag in ["albumartist", "performer"]:
            self.id3[tag] = u"foo"
            self.id3.save(self.filename)
            id3 = EasyID3(self.filename)
            self.failUnlessEqual(id3[tag], [u"foo"])
