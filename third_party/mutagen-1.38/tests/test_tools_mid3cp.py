# -*- coding: utf-8 -*-
# Copyright 2014 Ben Ockmore
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.

"""Tests for mid3cp tool. Since the tool is quite simple, most of the
functionality is covered by the mutagen package tests - these simply test
usage.
"""

import os
from tempfile import mkstemp
import shutil

import mutagen.id3
from mutagen.id3 import ID3, ParseID3v1
from mutagen._senf import fsnative as fsn

from tests.test_tools import _TTools
from tests import DATA_DIR


class TMid3cp(_TTools):

    TOOL_NAME = u"mid3cp"

    def setUp(self):
        super(TMid3cp, self).setUp()
        original = os.path.join(DATA_DIR, fsn(u'silence-44-s.mp3'))
        fd, self.filename = mkstemp(suffix=fsn(u'öäü.mp3'))
        os.close(fd)
        shutil.copy(original, self.filename)

        fd, self.blank_file = mkstemp(suffix=fsn(u'.mp3'))
        os.close(fd)

    def tearDown(self):
        super(TMid3cp, self).tearDown()
        os.unlink(self.filename)
        os.unlink(self.blank_file)

    def test_merge(self):
        id3 = ID3(self.filename)
        id3.delete()
        id3.add(mutagen.id3.TALB(text=[u"foo"]))
        id3.save(v2_version=3)

        target = ID3()
        target.add(mutagen.id3.TPE1(text=[u"bar", u"quux"]))
        target.save(self.blank_file, v2_version=4)

        res, out, err = self.call2(
            self.filename, self.blank_file, fsn(u"--merge"))
        assert not any([res, out, err])

        result = ID3(self.blank_file)
        assert result.version == (2, 4, 0)
        assert result.getall("TALB")[0].text == [u"foo"]
        assert result.getall("TPE1")[0].text == [u"bar", u"quux"]

    def test_merge_dst_no_tag(self):
        id3 = ID3(self.filename)
        id3.delete()
        id3.save(v2_version=3)

        with open(self.blank_file, "wb") as h:
            h.write(b"SOMEDATA")
        res, out, err = self.call2(
            self.filename, self.blank_file, fsn(u"--merge"))
        assert not any([res, out, err])

        result = ID3(self.blank_file)
        assert result.version == (2, 3, 0)

    def test_noop(self):
        res, out, err = self.call2()
        self.assertNotEqual(res, 0)
        self.failUnless("Usage:" in err)

    def test_src_equal_dst(self):
        res = self.call2(self.filename, self.filename)[0]
        self.assertEqual(res, 0)

    def test_copy(self):
        res = self.call(self.filename, self.blank_file)[0]
        self.failIf(res)

        original_id3 = ID3(self.filename)
        copied_id3 = ID3(self.blank_file)
        self.assertEqual(copied_id3.version, (2, 3, 0))

        # XXX: the v2.3 frame contains duplicate TPE1 frames which get merged
        # when saving to v2.3 again
        frame = copied_id3["TPE1"]
        frame.text = frame.text[0].split("/")

        self.failUnlessEqual(original_id3, copied_id3)

        for key in original_id3:
            # Go through every tag in the original file, and check that it's
            # present and correct in the copy
            self.failUnless(key in copied_id3)
            self.failUnlessEqual(copied_id3[key], original_id3[key])

    def test_include_id3v1(self):
        self.call(fsn(u'--write-v1'), self.filename, self.blank_file)

        with open(self.blank_file, 'rb') as fileobj:
            fileobj.seek(-128, 2)
            frames = ParseID3v1(fileobj.read(128))

        # If ID3v1 frames are present, assume they've been written correctly by
        # mutagen, so no need to check them
        self.failUnless(frames)

    def test_exclude_tag_unicode(self):
        self.call(fsn(u'-x'), fsn(u''), self.filename, self.blank_file)

    def test_exclude_single_tag(self):
        self.call(fsn(u'-x'), fsn(u'TLEN'), self.filename, self.blank_file)

        original_id3 = ID3(self.filename)
        copied_id3 = ID3(self.blank_file)

        self.failUnless('TLEN' in original_id3)
        self.failIf('TLEN' in copied_id3)

    def test_exclude_multiple_tag(self):
        self.call(fsn(u'-x'), fsn(u'TLEN'), fsn(u'-x'), fsn(u'TCON'),
                  fsn(u'-x'), fsn(u'TALB'), self.filename, self.blank_file)

        original_id3 = ID3(self.filename)
        copied_id3 = ID3(self.blank_file)

        self.failUnless('TLEN' in original_id3)
        self.failUnless('TCON' in original_id3)
        self.failUnless('TALB' in original_id3)
        self.failIf('TLEN' in copied_id3)
        self.failIf('TCON' in copied_id3)
        self.failIf('TALB' in copied_id3)

    def test_no_src_header(self):
        fd, blank_file2 = mkstemp(suffix=fsn(u'.mp3'))
        os.close(fd)
        try:
            err = self.call2(self.blank_file, blank_file2)[2]
            self.failUnless("No ID3 header found" in err)
        finally:
            os.unlink(blank_file2)

    def test_verbose(self):
        err = self.call2(self.filename, fsn(u"--verbose"), self.blank_file)[2]
        self.failUnless('mp3 contains:' in err)
        self.failUnless('Successfully saved' in err)

    def test_quiet(self):
        out = self.call(self.filename, self.blank_file)[1]
        self.failIf(out)

    def test_exit_status(self):
        status, out, err = self.call2(self.filename)
        self.assertTrue(status)

        status, out, err = self.call2(self.filename, self.filename)
        self.assertFalse(status)

        status, out, err = self.call2(self.blank_file, self.filename)
        self.assertTrue(status)

        status, out, err = self.call2(fsn(u""), self.filename)
        self.assertTrue(status)

        status, out, err = self.call2(self.filename, self.blank_file)
        self.assertFalse(status)

    def test_v23_v24(self):
        self.assertEqual(ID3(self.filename).version, (2, 3, 0))
        self.call(self.filename, self.blank_file)
        self.assertEqual(ID3(self.blank_file).version, (2, 3, 0))

        ID3(self.filename).save()
        self.call(self.filename, self.blank_file)
        self.assertEqual(ID3(self.blank_file).version, (2, 4, 0))
