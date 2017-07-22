# -*- coding: utf-8 -*-

import os

from mutagen import MutagenError
from mutagen.easymp4 import EasyMP4, error as MP4Error

from tests import TestCase, DATA_DIR, get_temp_copy


class TEasyMP4(TestCase):

    def setUp(self):
        self.filename = get_temp_copy(os.path.join(DATA_DIR, 'has-tags.m4a'))
        self.mp4 = EasyMP4(self.filename)
        self.mp4.delete()

    def tearDown(self):
        os.unlink(self.filename)

    def test_pprint(self):
        self.mp4["artist"] = "baz"
        self.mp4.pprint()

    def test_has_key(self):
        self.failIf("foo" in self.mp4)

    def test_empty_file(self):
        empty = os.path.join(DATA_DIR, 'emptyfile.mp3')
        self.assertRaises(MP4Error, EasyMP4, filename=empty)

    def test_nonexistent_file(self):
        empty = os.path.join(DATA_DIR, 'does', 'not', 'exist')
        self.assertRaises(MutagenError, EasyMP4, filename=empty)

    def test_write_single(self):
        for key in EasyMP4.Get:
            if key in ["tracknumber", "discnumber", "date", "bpm"]:
                continue

            # Test creation
            self.mp4[key] = "a test value"
            self.mp4.save(self.filename)
            mp4 = EasyMP4(self.filename)
            self.failUnlessEqual(mp4[key], ["a test value"])
            self.failUnlessEqual(mp4.keys(), [key])

            # And non-creation setting.
            self.mp4[key] = "a test value"
            self.mp4.save(self.filename)
            mp4 = EasyMP4(self.filename)
            self.failUnlessEqual(mp4[key], ["a test value"])
            self.failUnlessEqual(mp4.keys(), [key])

            del(self.mp4[key])

    def test_write_double(self):
        for key in EasyMP4.Get:
            if key in ["tracknumber", "discnumber", "date", "bpm"]:
                continue

            self.mp4[key] = ["a test", "value"]
            self.mp4.save(self.filename)
            mp4 = EasyMP4(self.filename)
            self.failUnlessEqual(mp4.get(key), ["a test", "value"])
            self.failUnlessEqual(mp4.keys(), [key])

            self.mp4[key] = ["a test", "value"]
            self.mp4.save(self.filename)
            mp4 = EasyMP4(self.filename)
            self.failUnlessEqual(mp4.get(key), ["a test", "value"])
            self.failUnlessEqual(mp4.keys(), [key])

            del(self.mp4[key])

    def test_write_date(self):
        self.mp4["date"] = "2004"
        self.mp4.save(self.filename)
        mp4 = EasyMP4(self.filename)
        self.failUnlessEqual(mp4["date"], ["2004"])

        self.mp4["date"] = "2004"
        self.mp4.save(self.filename)
        mp4 = EasyMP4(self.filename)
        self.failUnlessEqual(mp4["date"], ["2004"])

    def test_date_delete(self):
        self.mp4["date"] = "2004"
        self.failUnlessEqual(self.mp4["date"], ["2004"])
        del(self.mp4["date"])
        self.failIf("date" in self.mp4)

    def test_write_date_double(self):
        self.mp4["date"] = ["2004", "2005"]
        self.mp4.save(self.filename)
        mp4 = EasyMP4(self.filename)
        self.failUnlessEqual(mp4["date"], ["2004", "2005"])

        self.mp4["date"] = ["2004", "2005"]
        self.mp4.save(self.filename)
        mp4 = EasyMP4(self.filename)
        self.failUnlessEqual(mp4["date"], ["2004", "2005"])

    def test_write_invalid(self):
        self.failUnlessRaises(ValueError, self.mp4.__getitem__, "notvalid")
        self.failUnlessRaises(ValueError, self.mp4.__delitem__, "notvalid")
        self.failUnlessRaises(
            ValueError, self.mp4.__setitem__, "notvalid", "tests")

    def test_numeric(self):
        for tag in ["bpm"]:
            self.mp4[tag] = "3"
            self.failUnlessEqual(self.mp4[tag], ["3"])
            self.mp4.save()
            mp4 = EasyMP4(self.filename)
            self.failUnlessEqual(mp4[tag], ["3"])

            del(mp4[tag])
            self.failIf(tag in mp4)
            self.failUnlessRaises(KeyError, mp4.__delitem__, tag)

            self.failUnlessRaises(
                ValueError, self.mp4.__setitem__, tag, "hello")

    def test_numeric_pairs(self):
        for tag in ["tracknumber", "discnumber"]:
            self.mp4[tag] = "3"
            self.failUnlessEqual(self.mp4[tag], ["3"])
            self.mp4.save()
            mp4 = EasyMP4(self.filename)
            self.failUnlessEqual(mp4[tag], ["3"])

            del(mp4[tag])
            self.failIf(tag in mp4)
            self.failUnlessRaises(KeyError, mp4.__delitem__, tag)

            self.mp4[tag] = "3/10"
            self.failUnlessEqual(self.mp4[tag], ["3/10"])
            self.mp4.save()
            mp4 = EasyMP4(self.filename)
            self.failUnlessEqual(mp4[tag], ["3/10"])

            del(mp4[tag])
            self.failIf(tag in mp4)
            self.failUnlessRaises(KeyError, mp4.__delitem__, tag)

            self.failUnlessRaises(
                ValueError, self.mp4.__setitem__, tag, "hello")
