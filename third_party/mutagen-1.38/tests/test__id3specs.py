# -*- coding: utf-8 -*-

from tests import TestCase

from mutagen._compat import PY3
from mutagen.id3._specs import SpecError, Latin1TextListSpec, ID3FramesSpec, \
    ASPIIndexSpec, ByteSpec, EncodingSpec, StringSpec, BinaryDataSpec, \
    EncodedTextSpec, VolumePeakSpec, VolumeAdjustmentSpec, CTOCFlagsSpec, \
    Spec, SynchronizedTextSpec, TimeStampSpec, FrameIDSpec, RVASpec
from mutagen.id3._frames import Frame
from mutagen.id3._tags import ID3Header, ID3Tags, ID3SaveConfig
from mutagen.id3 import TIT3, ASPI, CTOCFlags, ID3TimeStamp


class TSynchronizedTextSpec(TestCase):

    def test_write(self):
        s = SynchronizedTextSpec('name')
        f = Frame()

        values = [(u"A", 100), (u"\xe4xy", 0), (u"", 42), (u"", 0)]

        # utf-16
        f.encoding = 1
        self.assertEqual(
            s.read(None, f, s.write(None, f, values)), (values, b""))
        data = s.write(None, f, [(u"A", 100)])
        self.assertEquals(data, b"\xff\xfeA\x00\x00\x00\x00\x00\x00d")

        # utf-16be
        f.encoding = 2
        self.assertEqual(
            s.read(None, f, s.write(None, f, values)), (values, b""))
        self.assertEquals(
            s.write(None, f, [(u"A", 100)]), b"\x00A\x00\x00\x00\x00\x00d")

        # utf-8
        f.encoding = 3
        self.assertEqual(
            s.read(None, f, s.write(None, f, values)), (values, b""))
        self.assertEquals(
            s.write(None, f, [(u"A", 100)]), b"A\x00\x00\x00\x00d")


class TTimeStampSpec(TestCase):

    def test_read(self):
        s = TimeStampSpec('name')
        f = Frame()
        f.encoding = 0
        header = ID3Header()
        header.version = (2, 4, 0)
        self.assertEquals(
            (ID3TimeStamp('ab'), b'fg'), s.read(header, f, b'ab\x00fg'))
        self.assertEquals(
            (ID3TimeStamp('1234'), b''), s.read(header, f, b'1234\x00'))

    def test_write(self):
        s = TimeStampSpec('name')
        f = Frame()
        f.encoding = 0
        self.assertEquals(b'1234\x00', s.write(None, f, ID3TimeStamp('1234')))
        self.assertRaises(AttributeError, s.write, None, f, None)


class TEncodedTextSpec(TestCase):

    def test_read(self):
        s = EncodedTextSpec('name')
        f = Frame()
        f.encoding = 0
        header = ID3Header()
        header.version = (2, 4, 0)
        self.assertEquals((u'abcd', b'fg'), s.read(header, f, b'abcd\x00fg'))

    def test_write(self):
        s = EncodedTextSpec('name')
        f = Frame()
        f.encoding = 0
        self.assertEquals(b'abcdefg\x00', s.write(None, f, u'abcdefg'))
        self.assertRaises(AttributeError, s.write, None, f, None)


class TEncodingSpec(TestCase):

    def test_read(self):
        s = EncodingSpec('name')
        self.assertEquals((3, b'abcdefg'), s.read(None, None, b'\x03abcdefg'))
        self.assertRaises(SpecError, s.read, None, None, b'\x04abcdefg')

    def test_write(self):
        s = EncodingSpec('name')
        self.assertEquals(b'\x00', s.write(None, None, 0))
        self.assertRaises(TypeError, s.write, None, None, b'abc')
        self.assertRaises(TypeError, s.write, None, None, None)

    def test_validate(self):
        s = EncodingSpec('name')
        self.assertRaises(TypeError, s.validate, None, None)


class TASPIIndexSpec(TestCase):

    def test_read(self):
        frame = ASPI(b=16, N=2)
        s = ASPIIndexSpec('name', [])
        self.assertRaises(SpecError, s.read, None, frame, b'')
        self.assertEqual(
            s.read(None, frame, b'\x01\x00\x00\x01'), ([256, 1], b""))
        frame = ASPI(b=42)
        self.assertRaises(SpecError, s.read, None, frame, b'')


class TVolumeAdjustmentSpec(TestCase):

    def test_validate(self):
        s = VolumeAdjustmentSpec('gain', 0)
        self.assertRaises(ValueError, s.validate, None, 65)

    def test_read(self):
        s = VolumeAdjustmentSpec('gain', 0)
        self.assertEquals((0.0, b''), s.read(None, None, b'\x00\x00'))
        self.assertEquals((2.0, b''), s.read(None, None, b'\x04\x00'))
        self.assertEquals((-2.0, b''), s.read(None, None, b'\xfc\x00'))

    def test_write(self):
        s = VolumeAdjustmentSpec('gain', 0)
        self.assertEquals(b'\x00\x00', s.write(None, None, 0.0))
        self.assertEquals(b'\x04\x00', s.write(None, None, 2.0))
        self.assertEquals(b'\xfc\x00', s.write(None, None, -2.0))


class TByteSpec(TestCase):

    def test_validate(self):
        s = ByteSpec('byte')
        self.assertRaises(ValueError, s.validate, None, 1000)

    def test_read(self):
        s = ByteSpec('name')
        self.assertEquals((97, b'bcdefg'), s.read(None, None, b'abcdefg'))

    def test_write(self):
        s = ByteSpec('name')
        self.assertEquals(b'a', s.write(None, None, 97))
        self.assertRaises(TypeError, s.write, None, None, b'abc')
        self.assertRaises(TypeError, s.write, None, None, None)


class TVolumePeakSpec(TestCase):

    def test_validate(self):
        s = VolumePeakSpec('peak', 0)
        self.assertRaises(ValueError, s.validate, None, 2)


class TStringSpec(TestCase):

    def test_validate(self):
        s = StringSpec('byte', 3)
        self.assertEqual(s.validate(None, "ABC"), "ABC")
        self.assertEqual(s.validate(None, u"ABC"), u"ABC")
        self.assertRaises(ValueError, s.validate, None, "abc2")
        self.assertRaises(ValueError, s.validate, None, "ab")
        self.assertRaises(TypeError, s.validate, None, None)

        if PY3:
            self.assertRaises(TypeError, s.validate, None, b"ABC")
            self.assertRaises(ValueError, s.validate, None, u"\xf6\xe4\xfc")

    def test_read(self):
        s = StringSpec('name', 3)
        self.assertEquals(('abc', b'defg'), s.read(None, None, b'abcdefg'))
        self.assertRaises(SpecError, s.read, None, None, b'\xff')

    def test_write(self):
        s = StringSpec('name', 3)
        self.assertEquals(b'abc', s.write(None, None, 'abcdefg'))
        self.assertEquals(b'\x00\x00\x00', s.write(None, None, '\x00'))
        self.assertEquals(b'a\x00\x00', s.write(None, None, 'a'))


class TBinaryDataSpec(TestCase):

    def test_validate(self):
        s = BinaryDataSpec('name')
        self.assertRaises(TypeError, s.validate, None, None)
        self.assertEqual(s.validate(None, b"abc"), b"abc")
        if PY3:
            self.assertRaises(TypeError, s.validate, None, "abc")
        else:
            self.assertEqual(s.validate(None, u"abc"), b"abc")
            self.assertRaises(ValueError, s.validate, None, u"\xf6\xe4\xfc")

    def test_read(self):
        s = BinaryDataSpec('name')
        self.assertEquals((b'abcdefg', b''), s.read(None, None, b'abcdefg'))

    def test_write(self):
        s = BinaryDataSpec('name')
        self.assertEquals(b'43', s.write(None, None, 43))
        self.assertEquals(b'abc', s.write(None, None, b'abc'))


class TSpec(TestCase):

    def test_no_hash(self):
        self.failUnlessRaises(
            TypeError, {}.__setitem__, Spec("foo", None), None)


class TRVASpec(TestCase):

    def test_read(self):
        spec = RVASpec("name", False)
        val, rest = spec.read(
            None, None,
            b"\x03\x10\xc7\xc7\xc7\xc7\x00\x00\x00\x00\x00\x00\x00\x00")
        self.assertEqual(rest, b"")
        self.assertEqual(val, [51143, 51143, 0, 0, 0, 0])

    def test_read_stereo_only(self):
        spec = RVASpec("name", True)
        val, rest = spec.read(
            None, None,
            b"\x03\x10\xc7\xc7\xc7\xc7\x00\x00\x00\x00\x00\x00\x00\x00")
        self.assertEqual(rest, b"\x00\x00\x00\x00")
        self.assertEqual(val, [51143, 51143, 0, 0])

    def test_write(self):
        spec = RVASpec("name", False)
        data = spec.write(None, None, [0, 1, 2, 3, -4, -5])
        self.assertEqual(
            data, b"\x03\x10\x00\x00\x00\x01\x00\x02\x00\x03\x00\x04\x00\x05")

    def test_write_stereo_only(self):
        spec = RVASpec("name", True)
        self.assertRaises(
            SpecError, spec.write, None, None, [0, 0, 0, 0, 0, 0])

    def test_validate(self):
        spec = RVASpec("name", False)
        self.assertRaises(ValueError, spec.validate, None, [])
        self.assertEqual(spec.validate(None, [1, 2]), [1, 2])


class TFrameIDSpec(TestCase):

    def test_read(self):
        spec = FrameIDSpec("name", 3)
        self.assertEqual(spec.read(None, None, b"FOOX"), (u"FOO", b"X"))

    def test_validate(self):
        spec = FrameIDSpec("name", 3)
        self.assertRaises(ValueError, spec.validate, None, u"123")
        self.assertRaises(ValueError, spec.validate, None, u"TXXX")
        self.assertEqual(spec.validate(None, u"TXX"), u"TXX")

        spec = FrameIDSpec("name", 4)
        self.assertEqual(spec.validate(None, u"TXXX"), u"TXXX")


class TCTOCFlagsSpec(TestCase):

    def test_read(self):
        spec = CTOCFlagsSpec("name")
        v, r = spec.read(None, None, b"\x03")
        self.assertEqual(r, b"")
        self.assertEqual(v, 3)
        self.assertTrue(isinstance(v, CTOCFlags))

    def test_write(self):
        spec = CTOCFlagsSpec("name")
        self.assertEqual(spec.write(None, None, CTOCFlags.ORDERED), b"\x01")

    def test_validate(self):
        spec = CTOCFlagsSpec("name")
        self.assertEqual(spec.validate(None, 3), 3)
        self.assertTrue(isinstance(spec.validate(None, 3), CTOCFlags))
        self.assertEqual(spec.validate(None, None), None)


class TID3FramesSpec(TestCase):

    def test_read_empty(self):
        header = ID3Header()
        header.version = (2, 4, 0)
        spec = ID3FramesSpec("name")

        value, data = spec.read(header, None, b"")
        self.assertEqual(data, b"")
        self.assertTrue(isinstance(value, ID3Tags))

    def test_read_tit3(self):
        header = ID3Header()
        header.version = (2, 4, 0)
        spec = ID3FramesSpec("name")

        value, data = spec.read(header, None,
            b"TIT3" + b"\x00\x00\x00\x03" + b"\x00\x00" + b"\x03" + b"F\x00")

        self.assertTrue(isinstance(value, ID3Tags))
        self.assertEqual(data, b"")
        frames = value.getall("TIT3")
        self.assertEqual(len(frames), 1)
        self.assertEqual(frames[0].encoding, 3)
        self.assertEqual(frames[0].text, [u"F"])

    def test_write_empty(self):
        header = ID3Header()
        header.version = (2, 4, 0)
        spec = ID3FramesSpec("name")
        config = ID3SaveConfig()

        tags = ID3Tags()
        self.assertEqual(spec.write(config, None, tags), b"")

    def test_write_tit3(self):
        spec = ID3FramesSpec("name")
        config = ID3SaveConfig()

        tags = ID3Tags()
        tags.add(TIT3(encoding=3, text=[u"F", u"B"]))
        self.assertEqual(spec.write(config, None, tags),
            b"TIT3" + b"\x00\x00\x00\x05" + b"\x00\x00" +
            b"\x03" + b"F\x00" + b"B\x00")

    def test_write_tit3_v23(self):
        spec = ID3FramesSpec("name")
        config = ID3SaveConfig(3, "/")

        tags = ID3Tags()
        tags.add(TIT3(encoding=3, text=[u"F", u"B"]))
        self.assertEqual(spec.write(config, None, tags),
            b"TIT3" + b"\x00\x00\x00\x0B" + b"\x00\x00" +
            b"\x01" + b"\xff\xfeF\x00/\x00B\x00\x00\x00")

    def test_validate(self):
        header = ID3Header()
        header.version = (2, 4, 0)
        spec = ID3FramesSpec("name")

        self.assertRaises(TypeError, spec.validate, None, None)
        self.assertTrue(isinstance(spec.validate(None, []), ID3Tags))

        v = spec.validate(None, [TIT3(encoding=3, text=[u"foo"])])
        self.assertEqual(v.getall("TIT3")[0].text, [u"foo"])


class TLatin1TextListSpec(TestCase):

    def test_read(self):
        spec = Latin1TextListSpec("name")
        self.assertEqual(spec.read(None, None, b"\x00xxx"), ([], b"xxx"))
        self.assertEqual(
            spec.read(None, None, b"\x01foo\x00"), ([u"foo"], b""))
        self.assertEqual(
            spec.read(None, None, b"\x01\x00"), ([u""], b""))
        self.assertEqual(
            spec.read(None, None, b"\x02f\x00o\x00"), ([u"f", u"o"], b""))

    def test_write(self):
        spec = Latin1TextListSpec("name")
        self.assertEqual(spec.write(None, None, []), b"\x00")
        self.assertEqual(spec.write(None, None, [u""]), b"\x01\x00")

    def test_validate(self):
        spec = Latin1TextListSpec("name")
        self.assertRaises(TypeError, spec.validate, None, object())
        self.assertRaises(TypeError, spec.validate, None, None)
        self.assertEqual(spec.validate(None, [u"foo"]), [u"foo"])
        self.assertEqual(spec.validate(None, []), [])
