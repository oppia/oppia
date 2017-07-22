# -*- coding: utf-8 -*-

import os
import sys
from tempfile import mkstemp
import shutil
import warnings

from tests import TestCase, DATA_DIR, get_temp_copy
from mutagen._compat import cBytesIO, text_type, xrange
from mutagen import File, Metadata, FileType, MutagenError, PaddingInfo
from mutagen._util import loadfile, get_size
from mutagen.oggvorbis import OggVorbis
from mutagen.oggflac import OggFLAC
from mutagen.oggspeex import OggSpeex
from mutagen.oggtheora import OggTheora
from mutagen.oggopus import OggOpus
from mutagen.mp3 import MP3, EasyMP3
from mutagen.id3 import ID3FileType
from mutagen.apev2 import APEv2File
from mutagen.flac import FLAC
from mutagen.wavpack import WavPack
from mutagen.trueaudio import TrueAudio, EasyTrueAudio
from mutagen.mp4 import MP4
from mutagen.musepack import Musepack
from mutagen.monkeysaudio import MonkeysAudio
from mutagen.optimfrog import OptimFROG
from mutagen.asf import ASF
from mutagen.aiff import AIFF
from mutagen.aac import AAC
from mutagen.smf import SMF
from mutagen.dsf import DSF
from os import devnull


class TMetadata(TestCase):

    class FakeMeta(Metadata):
        def __init__(self):
            pass

    def test_virtual_constructor(self):
        self.failUnlessRaises(NotImplementedError, Metadata, cBytesIO())

    def test_load(self):
        m = Metadata()
        self.failUnlessRaises(NotImplementedError, m.load, cBytesIO())

    def test_virtual_save(self):
        self.failUnlessRaises(
            NotImplementedError, self.FakeMeta().save, cBytesIO())
        self.failUnlessRaises(
            NotImplementedError, self.FakeMeta().save, cBytesIO())

    def test_virtual_delete(self):
        self.failUnlessRaises(
            NotImplementedError, self.FakeMeta().delete, cBytesIO())
        self.failUnlessRaises(
            NotImplementedError, self.FakeMeta().delete, cBytesIO())


class TPaddingInfo(TestCase):

    def test_props(self):
        info = PaddingInfo(10, 100)
        self.assertEqual(info.size, 100)
        self.assertEqual(info.padding, 10)

        info = PaddingInfo(-10, 100)
        self.assertEqual(info.size, 100)
        self.assertEqual(info.padding, -10)

    def test_default_strategy(self):
        s = 100000
        self.assertEqual(PaddingInfo(10, s).get_default_padding(), 10)
        self.assertEqual(PaddingInfo(-10, s).get_default_padding(), 1124)
        self.assertEqual(PaddingInfo(0, s).get_default_padding(), 0)
        self.assertEqual(PaddingInfo(20000, s).get_default_padding(), 1124)

        self.assertEqual(PaddingInfo(10, 0).get_default_padding(), 10)
        self.assertEqual(PaddingInfo(-10, 0).get_default_padding(), 1024)
        self.assertEqual(PaddingInfo(1050, 0).get_default_padding(), 1050)
        self.assertEqual(PaddingInfo(20000, 0).get_default_padding(), 1024)

    def test_repr(self):
        info = PaddingInfo(10, 100)
        self.assertEqual(repr(info), "<PaddingInfo size=100 padding=10>")


class MyFileType(FileType):

    @loadfile()
    def load(self, filething, arg=1):
        self.filename = filething.filename
        self.fileobj = filething.fileobj
        self.arg = arg


class TFileTypeLoad(TestCase):

    filename = os.path.join(DATA_DIR, "empty.ogg")

    def test_old_argument_handling(self):
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            f = MyFileType()
        self.assertFalse(hasattr(f, "a"))

        f = MyFileType(self.filename)
        self.assertEquals(f.arg, 1)

        f = MyFileType(self.filename, 42)
        self.assertEquals(f.arg, 42)
        self.assertEquals(f.filename, self.filename)

        f = MyFileType(self.filename, arg=42)
        self.assertEquals(f.arg, 42)

        f = MyFileType(filename=self.filename, arg=42)
        self.assertEquals(f.arg, 42)

        self.assertRaises(TypeError, MyFileType, self.filename, nope=42)
        self.assertRaises(TypeError, MyFileType, nope=42)
        self.assertRaises(TypeError, MyFileType, self.filename, 42, 24)

    def test_both_args(self):
        # fileobj wins, but filename is saved
        x = cBytesIO()
        f = MyFileType(filename="foo", fileobj=x)
        self.assertTrue(f.fileobj is x)
        self.assertEquals(f.filename, "foo")

    def test_fileobj(self):
        x = cBytesIO()
        f = MyFileType(fileobj=x)
        self.assertTrue(f.fileobj is x)
        self.assertTrue(f.filename is None)

    def test_magic(self):
        x = cBytesIO()
        f = MyFileType(x)
        self.assertTrue(f.fileobj is x)
        self.assertTrue(f.filename is None)

    def test_filething(self):
        # while load() has that arg, we don't allow it as kwarg, either
        # pass per arg, or be explicit about the type.
        x = cBytesIO()
        self.assertRaises(TypeError, MyFileType, filething=x)

    def test_filename_explicit(self):
        x = cBytesIO()
        self.assertRaises(ValueError, MyFileType, filename=x)


class TFileType(TestCase):

    def setUp(self):
        self.vorbis = File(os.path.join(DATA_DIR, "empty.ogg"))

        filename = get_temp_copy(os.path.join(DATA_DIR, "xing.mp3"))
        self.mp3_notags = File(filename)
        self.mp3_filename = filename

    def tearDown(self):
        os.remove(self.mp3_filename)

    def test_delitem_not_there(self):
        self.failUnlessRaises(KeyError, self.vorbis.__delitem__, "foobar")

    def test_add_tags(self):
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            self.failUnlessRaises(NotImplementedError, FileType().add_tags)

    def test_delitem(self):
        self.vorbis["foobar"] = "quux"
        del(self.vorbis["foobar"])
        self.failIf("quux" in self.vorbis)

    def test_save_no_tags(self):
        self.assertTrue(self.mp3_notags.tags is None)
        self.assertTrue(self.mp3_notags.filename)
        self.mp3_notags.save()
        self.assertTrue(self.mp3_notags.tags is None)


class _TestFileObj(object):
    """A file-like object which fails in various ways"""

    def __init__(self, fileobj, stop_after=-1, fail_after=-1):
        """
        Args:
            stop_after (int): size of data to return on read in total
            fail_after (int): after this number of operations every method
                will raise IOError
        """

        self._fileobj = fileobj
        self._stop_after = stop_after
        self._fail_after = fail_after

        self.dataread = 0
        self.operations = 0

        fileobj.seek(0, 0)

    def _check_fail(self):
        self.operations += 1
        if self._fail_after != -1:
            if self.operations > self._fail_after:
                raise IOError("fail")

    def tell(self):
        self._check_fail()
        return self._fileobj.tell()

    def write(self, data):
        try:
            self._check_fail()
        except IOError:
            # we use write(b"") to check if the fileobj is writable
            if len(data):
                raise
        self._fileobj.write(data)

    def truncate(self, *args, **kwargs):
        self._check_fail()
        self._fileobj.truncate(*args, **kwargs)

    def flush(self):
        self._fileobj.flush()

    def read(self, size=-1):
        try:
            self._check_fail()
        except IOError:
            # we use read(0) to test for the file object type, so don't error
            # out in that case
            if size != 0:
                raise

        data = self._fileobj.read(size)
        self.dataread += len(data)
        if self._stop_after != -1 and self.dataread > self._stop_after:
            data = data[:self._stop_after - self.dataread]
        return data

    def seek(self, offset, whence=0):
        self._check_fail()

        # make sure we don't go negative
        if whence == 0:
            final_position = offset
        elif whence == 1:
            final_position = self._fileobj.tell() + offset
        elif whence == 2:
            final_position = get_size(self._fileobj) + offset
        assert final_position >= 0, final_position

        return self._fileobj.seek(offset, whence)


def iter_test_file_objects(fileobj):
    """Given a file object yields the same file object which fails differently
    each time
    """

    t = _TestFileObj(fileobj)
    # first figure out how much a successful attempt reads and how many
    # file object operations it executes.
    yield t
    for i in xrange(t.dataread):
        yield _TestFileObj(fileobj, stop_after=i)
    for i in xrange(t.operations):
        yield _TestFileObj(fileobj, fail_after=i)


class TAbstractFileType(object):

    PATH = None
    KIND = None

    def setUp(self):
        self.filename = get_temp_copy(self.PATH)
        self.audio = self.KIND(self.filename)

    def tearDown(self):
        try:
            os.remove(self.filename)
        except OSError:
            pass

    def test_fileobj_load(self):
        with open(self.filename, "rb") as h:
            self.KIND(h)

    def test_fileobj_save(self):
        with open(self.filename, "rb+") as h:
            f = self.KIND(h)
            h.seek(0)
            f.save(h)
            h.seek(0)
            f.delete(h)

    def test_module_delete_fileobj(self):
        mod = sys.modules[self.KIND.__module__]
        if hasattr(mod, "delete"):
            with open(self.filename, "rb+") as h:
                mod.delete(fileobj=h)

    def test_stringio(self):
        with open(self.filename, "rb") as h:
            fileobj = cBytesIO(h.read())
            self.KIND(fileobj)
            # make sure it's not closed
            fileobj.read(0)

    def test_testfileobj(self):
        with open(self.filename, "rb") as h:
            self.KIND(_TestFileObj(h))

    def test_test_fileobj_load(self):
        with open(self.filename, "rb") as h:
            for t in iter_test_file_objects(h):
                try:
                    self.KIND(t)
                except MutagenError:
                    pass

    def test_test_fileobj_save(self):
        with open(self.filename, "rb+") as h:
            o = self.KIND(_TestFileObj(h))
            for t in iter_test_file_objects(h):
                try:
                    o.save(fileobj=t)
                except MutagenError:
                    pass

    def test_test_fileobj_delete(self):
        with open(self.filename, "rb+") as h:
            o = self.KIND(_TestFileObj(h))
            for t in iter_test_file_objects(h):
                try:
                    o.delete(fileobj=t)
                except MutagenError:
                    pass

    def test_filename(self):
        self.assertEqual(self.audio.filename, self.filename)

    def test_file(self):
        self.assertTrue(isinstance(File(self.PATH), self.KIND))

    def test_not_file(self):
        self.failUnlessRaises(MutagenError, self.KIND, "/dev/doesnotexist")

    def test_pprint(self):
        res = self.audio.pprint()
        self.assertTrue(res)
        self.assertTrue(isinstance(res, text_type))

    def test_info(self):
        self.assertTrue(self.audio.info)

    def test_info_pprint(self):
        res = self.audio.info.pprint()
        self.assertTrue(res)
        self.assertTrue(isinstance(res, text_type))

    def test_mime(self):
        self.assertTrue(self.audio.mime)
        self.assertTrue(isinstance(self.audio.mime, list))

    def test_load(self):
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            x = self.KIND()
        x.load(self.filename)
        x.save()

    def test_delete(self):
        self.audio.delete(self.filename)
        self.audio.delete()

    def test_delete_nonexisting(self):
        # if there are none, add them first
        if not self.audio.tags:
            try:
                self.audio.add_tags()
            except MutagenError:
                pass
            else:
                self.audio.save()

        os.remove(self.filename)
        try:
            self.audio.delete()
        except MutagenError:
            pass

    def test_save_nonexisting(self):
        os.remove(self.filename)
        tags = self.audio.tags
        # Metadata creates a new file
        if not isinstance(tags, Metadata):
            try:
                self.audio.save()
            except MutagenError:
                pass

    def test_save(self):
        self.audio.save(self.filename)
        self.audio.save()

    def test_add_tags(self):
        had_tags = self.audio.tags is not None
        try:
            self.audio.add_tags()
        except MutagenError:
            pass
        else:
            self.assertFalse(had_tags)
            self.assertTrue(self.audio.tags is not None)
        self.assertRaises(MutagenError, self.audio.add_tags)

    def test_score(self):
        with open(self.filename, "rb") as fileobj:
            header = fileobj.read(128)
            self.KIND.score(self.filename, fileobj, header)

    def test_dict(self):
        self.audio.keys()
        self.assertRaises(KeyError, self.audio.__delitem__, "nopenopenopenope")
        for key, value in self.audio.items():
            del self.audio[key]
            self.audio[key] = value


_FILETYPES = {
    OggVorbis: [os.path.join(DATA_DIR, "empty.ogg")],
    OggFLAC: [os.path.join(DATA_DIR, "empty.oggflac")],
    OggSpeex: [os.path.join(DATA_DIR, "empty.spx")],
    OggTheora: [os.path.join(DATA_DIR, "sample.oggtheora")],
    OggOpus: [os.path.join(DATA_DIR, "example.opus")],
    FLAC: [os.path.join(DATA_DIR, "silence-44-s.flac")],
    TrueAudio: [os.path.join(DATA_DIR, "empty.tta")],
    WavPack: [os.path.join(DATA_DIR, "silence-44-s.wv")],
    MP3: [
        os.path.join(DATA_DIR, "bad-xing.mp3"),
        os.path.join(DATA_DIR, "xing.mp3"),
        os.path.join(DATA_DIR, "silence-44-s.mp3"),
    ],
    Musepack: [
        os.path.join(DATA_DIR, "click.mpc"),
        os.path.join(DATA_DIR, "sv4_header.mpc"),
        os.path.join(DATA_DIR, "sv5_header.mpc"),
        os.path.join(DATA_DIR, "sv8_header.mpc"),
    ],
    OptimFROG: [
        os.path.join(DATA_DIR, "empty.ofr"),
        os.path.join(DATA_DIR, "empty.ofs"),
    ],
    AAC: [
        os.path.join(DATA_DIR, "empty.aac"),
        os.path.join(DATA_DIR, "adif.aac"),
    ],
    ASF: [
        os.path.join(DATA_DIR, "silence-1.wma"),
        os.path.join(DATA_DIR, "silence-2.wma"),
        os.path.join(DATA_DIR, "silence-3.wma"),
    ],
    AIFF: [
        os.path.join(DATA_DIR, "with-id3.aif"),
        os.path.join(DATA_DIR, "11k-1ch-2s-silence.aif"),
        os.path.join(DATA_DIR, "48k-2ch-s16-silence.aif"),
        os.path.join(DATA_DIR, "8k-1ch-1s-silence.aif"),
        os.path.join(DATA_DIR, "8k-1ch-3.5s-silence.aif"),
        os.path.join(DATA_DIR, "8k-4ch-1s-silence.aif")
    ],
    MonkeysAudio: [
        os.path.join(DATA_DIR, "mac-399.ape"),
        os.path.join(DATA_DIR, "mac-396.ape"),
    ],
    MP4: [
        os.path.join(DATA_DIR, "has-tags.m4a"),
        os.path.join(DATA_DIR, "no-tags.m4a"),
        os.path.join(DATA_DIR, "no-tags.3g2"),
        os.path.join(DATA_DIR, "truncated-64bit.mp4"),
    ],
    SMF: [
        os.path.join(DATA_DIR, "sample.mid"),
    ],
    DSF: [
        os.path.join(DATA_DIR, '2822400-1ch-0s-silence.dsf'),
        os.path.join(DATA_DIR, '5644800-2ch-s01-silence.dsf'),
        os.path.join(DATA_DIR, 'with-id3.dsf'),
        os.path.join(DATA_DIR, 'without-id3.dsf'),
    ]
}

_FILETYPES[ID3FileType] = _FILETYPES[MP3]
_FILETYPES[APEv2File] = _FILETYPES[MonkeysAudio]


def create_filetype_tests():
    for kind, paths in _FILETYPES.items():
        for i, path in enumerate(paths):
            suffix = "_" + str(i + 1) if i else ""
            new_type = type("TFileType" + kind.__name__ + suffix,
                            (TAbstractFileType, TestCase),
                            {"PATH": path, "KIND": kind})
            globals()[new_type.__name__] = new_type

create_filetype_tests()


class TFile(TestCase):

    @property
    def filenames(self):
        for kind, paths in _FILETYPES.items():
            for path in paths:
                yield path

    def test_bad(self):
        try:
            self.failUnless(File(devnull) is None)
        except (OSError, IOError):
            print("WARNING: Unable to open %s." % devnull)
        self.failUnless(File(__file__) is None)

    def test_empty(self):
        filename = os.path.join(DATA_DIR, "empty")
        open(filename, "wb").close()
        try:
            self.failUnless(File(filename) is None)
        finally:
            os.unlink(filename)

    def test_not_file(self):
        self.failUnlessRaises(MutagenError, File, "/dev/doesnotexist")

    def test_no_options(self):
        for filename in self.filenames:
            filename = os.path.join(DATA_DIR, filename)
            self.failIf(File(filename, options=[]))

    def test_fileobj(self):
        for filename in self.filenames:
            with open(filename, "rb") as h:
                self.assertTrue(File(h) is not None)
            with open(filename, "rb") as h:
                fileobj = cBytesIO(h.read())
                self.assertTrue(File(fileobj, filename=filename) is not None)

    def test_mock_fileobj(self):
        for filename in self.filenames:
            with open(filename, "rb") as h:
                for t in iter_test_file_objects(h):
                    try:
                        File(t)
                    except MutagenError:
                        pass

    def test_easy_mp3(self):
        self.failUnless(isinstance(
            File(os.path.join(DATA_DIR, "silence-44-s.mp3"), easy=True),
            EasyMP3))

    def test_apev2(self):
        self.failUnless(isinstance(
            File(os.path.join(DATA_DIR, "oldtag.apev2")), APEv2File))

    def test_easy_tta(self):
        self.failUnless(isinstance(
            File(os.path.join(DATA_DIR, "empty.tta"), easy=True),
            EasyTrueAudio))

    def test_id3_indicates_mp3_not_tta(self):
        header = b"ID3 the rest of this is garbage"
        fileobj = cBytesIO(header)
        filename = "not-identifiable.ext"
        self.failUnless(TrueAudio.score(filename, fileobj, header) <
                        MP3.score(filename, fileobj, header))

    def test_prefer_theora_over_vorbis(self):
        header = (
            b"OggS\x00\x02\x00\x00\x00\x00\x00\x00\x00\x00\xe1x\x06\x0f"
            b"\x00\x00\x00\x00)S'\xf4\x01*\x80theora\x03\x02\x01\x006\x00\x1e"
            b"\x00\x03V\x00\x01\xe0\x00\x00\x00\x00\x00\x18\x00\x00\x00\x01"
            b"\x00\x00\x00\x00\x00\x00\x00&%\xa0\x00\xc0OggS\x00\x02\x00\x00"
            b"\x00\x00\x00\x00\x00\x00d#\xa8\x1f\x00\x00\x00\x00]Y\xc0\xc0"
            b"\x01\x1e\x01vorbis\x00\x00\x00\x00\x02\x80\xbb\x00\x00\x00\x00"
            b"\x00\x00\x00\xee\x02\x00\x00\x00\x00\x00\xb8\x01")
        fileobj = cBytesIO(header)
        filename = "not-identifiable.ext"
        self.failUnless(OggVorbis.score(filename, fileobj, header) <
                        OggTheora.score(filename, fileobj, header))


class TFileUpperExt(TestCase):
    FILES = [
        (os.path.join(DATA_DIR, "empty.ofr"), OptimFROG),
        (os.path.join(DATA_DIR, "sv5_header.mpc"), Musepack),
        (os.path.join(DATA_DIR, "silence-3.wma"), ASF),
        (os.path.join(DATA_DIR, "truncated-64bit.mp4"), MP4),
        (os.path.join(DATA_DIR, "silence-44-s.flac"), FLAC),
    ]

    def setUp(self):
        checks = []
        for (original, instance) in self.FILES:
            ext = os.path.splitext(original)[1]
            fd, filename = mkstemp(suffix=ext.upper())
            os.close(fd)
            shutil.copy(original, filename)
            checks.append((filename, instance))
        self.checks = checks

    def test_case_insensitive_ext(self):
        for (path, instance) in self.checks:
            if isinstance(path, bytes):
                path = path.decode("ascii")
            self.failUnless(
                isinstance(File(path, options=[instance]), instance))
            path = path.encode("ascii")
            self.failUnless(
                isinstance(File(path, options=[instance]), instance))

    def tearDown(self):
        for (path, instance) in self.checks:
            os.unlink(path)


class TModuleImportAll(TestCase):

    def setUp(self):
        import mutagen
        files = os.listdir(mutagen.__path__[0])
        modules = set(os.path.splitext(f)[0] for f in files)
        modules = [f for f in modules if not f.startswith("_")]

        self.modules = []
        for module in modules:
            mod = getattr(__import__("mutagen." + module), module)
            self.modules.append(mod)

    def tearDown(self):
        del self.modules[:]

    def test_all(self):
        for mod in self.modules:
            for attr in getattr(mod, "__all__", []):
                getattr(mod, attr)

    def test_errors(self):
        for mod in self.modules:
            self.assertTrue(issubclass(mod.error, MutagenError), msg=mod.error)
