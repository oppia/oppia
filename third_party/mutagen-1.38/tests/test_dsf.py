# -*- coding: utf-8 -*-

import os

from mutagen.dsf import DSF, DSFFile, delete
from mutagen.dsf import error as DSFError

from tests import TestCase, DATA_DIR, get_temp_copy


class TDSF(TestCase):
    silence_1 = os.path.join(DATA_DIR, '2822400-1ch-0s-silence.dsf')
    silence_2 = os.path.join(DATA_DIR, '5644800-2ch-s01-silence.dsf')

    has_tags = os.path.join(DATA_DIR, 'with-id3.dsf')
    no_tags = os.path.join(DATA_DIR, 'without-id3.dsf')

    def setUp(self):
        self.filename_1 = get_temp_copy(self.has_tags)
        self.filename_2 = get_temp_copy(self.no_tags)

        self.dsf_tmp_id3 = DSF(self.filename_1)
        self.dsf_tmp_no_id3 = DSF(self.filename_2)

        self.dsf_1 = DSF(self.silence_1)
        self.dsf_2 = DSF(self.silence_2)

    def test_channels(self):
        self.failUnlessEqual(self.dsf_1.info.channels, 1)
        self.failUnlessEqual(self.dsf_2.info.channels, 2)

    def test_length(self):
        self.failUnlessEqual(self.dsf_1.info.length, 0)
        self.failUnlessEqual(self.dsf_2.info.length, 0.01)

    def test_sampling_frequency(self):
        self.failUnlessEqual(self.dsf_1.info.sample_rate, 2822400)
        self.failUnlessEqual(self.dsf_2.info.sample_rate, 5644800)

    def test_bits_per_sample(self):
        self.failUnlessEqual(self.dsf_1.info.bits_per_sample, 1)

    def test_notdsf(self):
        self.failUnlessRaises(
            DSFError, DSF, os.path.join(DATA_DIR, 'empty.ofr'))

    def test_pprint(self):
        self.failUnless(self.dsf_tmp_id3.pprint())

    def test_delete(self):
        self.dsf_tmp_id3.delete()
        self.failIf(self.dsf_tmp_id3.tags)
        self.failUnless(DSF(self.filename_1).tags is None)

    def test_module_delete(self):
        delete(self.filename_1)
        self.failUnless(DSF(self.filename_1).tags is None)

    def test_module_double_delete(self):
        delete(self.filename_1)
        delete(self.filename_1)

    def test_pprint_no_tags(self):
        self.dsf_tmp_id3.tags = None
        self.failUnless(self.dsf_tmp_id3.pprint())

    def test_save_no_tags(self):
        self.dsf_tmp_id3.tags = None
        self.dsf_tmp_id3.save()
        self.assertTrue(self.dsf_tmp_id3.tags is None)

    def test_add_tags_already_there(self):
        self.failUnless(self.dsf_tmp_id3.tags)
        self.failUnlessRaises(Exception, self.dsf_tmp_id3.add_tags)

    def test_mime(self):
        self.failUnless("audio/dsf" in self.dsf_tmp_id3.mime)

    def test_loaded_tags(self):
        self.failUnless(self.dsf_tmp_id3["TIT2"] == "DSF title")

    def test_roundtrip(self):
        self.failUnlessEqual(self.dsf_tmp_id3["TIT2"], ["DSF title"])
        self.dsf_tmp_id3.save()
        new = DSF(self.dsf_tmp_id3.filename)
        self.failUnlessEqual(new["TIT2"], ["DSF title"])

    def test_save_tags(self):
        from mutagen.id3 import TIT2
        tags = self.dsf_tmp_id3.tags
        tags.add(TIT2(encoding=3, text="foobar"))
        tags.save()

        new = DSF(self.dsf_tmp_id3.filename)
        self.failUnlessEqual(new["TIT2"], ["foobar"])

    def test_corrupt_tag(self):
        with open(self.filename_1, "r+b") as h:
            chunk = DSFFile(h).dsd_chunk
            h.seek(chunk.offset_metdata_chunk)
            h.seek(4, 1)
            h.write(b"\xff\xff")
        self.assertRaises(DSFError, DSF, self.filename_1)

    def test_padding(self):
        DSF(self.filename_1).save()
        self.assertEqual(DSF(self.filename_1).tags._padding, 1024)
        DSF(self.filename_1).save()
        self.assertEqual(DSF(self.filename_1).tags._padding, 1024)

        tags = DSF(self.filename_1)
        tags.save(padding=lambda x: 1)
        self.assertEqual(DSF(self.filename_1).tags._padding, 1)

        tags = DSF(self.filename_1)
        tags.save(padding=lambda x: 100)
        self.assertEqual(DSF(self.filename_1).tags._padding, 100)

        tags = DSF(self.filename_1)
        self.assertRaises(DSFError, tags.save, padding=lambda x: -1)

    def tearDown(self):
        os.unlink(self.filename_1)
        os.unlink(self.filename_2)
