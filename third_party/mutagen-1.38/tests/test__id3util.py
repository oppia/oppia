# -*- coding: utf-8 -*-

import sys
import struct

from tests import TestCase

from mutagen._compat import PY2
from mutagen.id3._util import BitPaddedInt, BitPaddedLong, unsynch


class BitPaddedIntTest(TestCase):

    def test_long(self):
        if PY2:
            data = BitPaddedInt.to_str(sys.maxint + 1, width=16)
            val = BitPaddedInt(data)
            self.assertEqual(val, sys.maxint + 1)
            self.assertTrue(isinstance(val, BitPaddedLong))
        else:
            self.assertTrue(BitPaddedInt is BitPaddedLong)

    def test_negative(self):
        self.assertRaises(ValueError, BitPaddedInt, -1)

    def test_zero(self):
        self.assertEquals(BitPaddedInt(b'\x00\x00\x00\x00'), 0)

    def test_1(self):
        self.assertEquals(BitPaddedInt(b'\x00\x00\x00\x01'), 1)

    def test_1l(self):
        self.assertEquals(
            BitPaddedInt(b'\x01\x00\x00\x00', bigendian=False), 1)

    def test_129(self):
        self.assertEquals(BitPaddedInt(b'\x00\x00\x01\x01'), 0x81)

    def test_129b(self):
        self.assertEquals(BitPaddedInt(b'\x00\x00\x01\x81'), 0x81)

    def test_65(self):
        self.assertEquals(BitPaddedInt(b'\x00\x00\x01\x81', 6), 0x41)

    def test_32b(self):
        self.assertEquals(BitPaddedInt(b'\xFF\xFF\xFF\xFF', bits=8),
                          0xFFFFFFFF)

    def test_32bi(self):
        self.assertEquals(BitPaddedInt(0xFFFFFFFF, bits=8), 0xFFFFFFFF)

    def test_s32b(self):
        self.assertEquals(BitPaddedInt(b'\xFF\xFF\xFF\xFF', bits=8).as_str(),
                          b'\xFF\xFF\xFF\xFF')

    def test_s0(self):
        self.assertEquals(BitPaddedInt.to_str(0), b'\x00\x00\x00\x00')

    def test_s1(self):
        self.assertEquals(BitPaddedInt.to_str(1), b'\x00\x00\x00\x01')

    def test_s1l(self):
        self.assertEquals(
            BitPaddedInt.to_str(1, bigendian=False), b'\x01\x00\x00\x00')

    def test_s129(self):
        self.assertEquals(BitPaddedInt.to_str(129), b'\x00\x00\x01\x01')

    def test_s65(self):
        self.assertEquals(BitPaddedInt.to_str(0x41, 6), b'\x00\x00\x01\x01')

    def test_w129(self):
        self.assertEquals(BitPaddedInt.to_str(129, width=2), b'\x01\x01')

    def test_w129l(self):
        self.assertEquals(
            BitPaddedInt.to_str(129, width=2, bigendian=False), b'\x01\x01')

    def test_wsmall(self):
        self.assertRaises(ValueError, BitPaddedInt.to_str, 129, width=1)

    def test_str_int_init(self):
        self.assertEquals(BitPaddedInt(238).as_str(),
                          BitPaddedInt(struct.pack('>L', 238)).as_str())

    def test_varwidth(self):
        self.assertEquals(len(BitPaddedInt.to_str(100)), 4)
        self.assertEquals(len(BitPaddedInt.to_str(100, width=-1)), 4)
        self.assertEquals(len(BitPaddedInt.to_str(2 ** 32, width=-1)), 5)

    def test_minwidth(self):
        self.assertEquals(
            len(BitPaddedInt.to_str(100, width=-1, minwidth=6)), 6)

    def test_inval_input(self):
        self.assertRaises(TypeError, BitPaddedInt, None)

    if PY2:
        def test_promote_long(self):
            l = BitPaddedInt(sys.maxint ** 2)
            self.assertTrue(isinstance(l, long))
            self.assertEqual(BitPaddedInt(l.as_str(width=-1)), l)

    def test_has_valid_padding(self):
        self.failUnless(BitPaddedInt.has_valid_padding(b"\xff\xff", bits=8))
        self.failIf(BitPaddedInt.has_valid_padding(b"\xff"))
        self.failIf(BitPaddedInt.has_valid_padding(b"\x00\xff"))
        self.failUnless(BitPaddedInt.has_valid_padding(b"\x7f\x7f"))
        self.failIf(BitPaddedInt.has_valid_padding(b"\x7f", bits=6))
        self.failIf(BitPaddedInt.has_valid_padding(b"\x9f", bits=6))
        self.failUnless(BitPaddedInt.has_valid_padding(b"\x3f", bits=6))

        self.failUnless(BitPaddedInt.has_valid_padding(0xff, bits=8))
        self.failIf(BitPaddedInt.has_valid_padding(0xff))
        self.failIf(BitPaddedInt.has_valid_padding(0xff << 8))
        self.failUnless(BitPaddedInt.has_valid_padding(0x7f << 8))
        self.failIf(BitPaddedInt.has_valid_padding(0x9f << 32, bits=6))
        self.failUnless(BitPaddedInt.has_valid_padding(0x3f << 16, bits=6))


class TestUnsynch(TestCase):

    def test_unsync_encode_decode(self):
        pairs = [
            (b'', b''),
            (b'\x00', b'\x00'),
            (b'\x44', b'\x44'),
            (b'\x44\xff', b'\x44\xff\x00'),
            (b'\xe0', b'\xe0'),
            (b'\xe0\xe0', b'\xe0\xe0'),
            (b'\xe0\xff', b'\xe0\xff\x00'),
            (b'\xff', b'\xff\x00'),
            (b'\xff\x00', b'\xff\x00\x00'),
            (b'\xff\x00\x00', b'\xff\x00\x00\x00'),
            (b'\xff\x01', b'\xff\x01'),
            (b'\xff\x44', b'\xff\x44'),
            (b'\xff\xe0', b'\xff\x00\xe0'),
            (b'\xff\xe0\xff', b'\xff\x00\xe0\xff\x00'),
            (b'\xff\xf0\x0f\x00', b'\xff\x00\xf0\x0f\x00'),
            (b'\xff\xff', b'\xff\x00\xff\x00'),
            (b'\xff\xff\x01', b'\xff\x00\xff\x01'),
            (b'\xff\xff\xff\xff', b'\xff\x00\xff\x00\xff\x00\xff\x00'),
        ]

        for d, e in pairs:
            self.assertEqual(unsynch.encode(d), e)
            self.assertEqual(unsynch.decode(e), d)
            self.assertEqual(unsynch.decode(unsynch.encode(e)), e)
            self.assertEqual(unsynch.decode(e + e), d + d)

    def test_unsync_decode_invalid(self):
        self.assertRaises(ValueError, unsynch.decode, b'\xff\xff\xff\xff')
        self.assertRaises(ValueError, unsynch.decode, b'\xff\xf0\x0f\x00')
        self.assertRaises(ValueError, unsynch.decode, b'\xff\xe0')
        self.assertRaises(ValueError, unsynch.decode, b'\xff')
