# -*- coding: utf-8 -*-

import operator

from tests import TestCase

from mutagen._compat import text_type, xrange, PY2, PY3, iteritems, izip, \
    integer_types
from mutagen._constants import GENRES
from mutagen.id3._tags import read_frames, save_frame, ID3Header
from mutagen.id3._util import ID3SaveConfig, is_valid_frame_id, \
    ID3JunkFrameError
from mutagen.id3 import APIC, CTOC, CHAP, TPE2, Frames, Frames_2_2, CRA, \
    AENC, PIC, LNK, LINK, SIGN, PRIV, GRID, ENCR, COMR, USER, UFID, GEOB, \
    POPM, EQU2, RVA2, COMM, SYLT, USLT, WXXX, TXXX, WCOM, TextFrame, \
    UrlFrame, NumericTextFrame, NumericPartTextFrame, TPE1, TIT2, \
    TimeStampTextFrame, TCON, ID3TimeStamp, Frame, RVRB, RBUF, CTOCFlags, \
    PairedTextFrame, BinaryFrame, ETCO, MLLT, SYTC, PCNT, PCST, POSS, OWNE, \
    SEEK, ASPI, PictureType, CRM, RVAD, RVA, ID3Tags

_22 = ID3Header()
_22.version = (2, 2, 0)

_23 = ID3Header()
_23.version = (2, 3, 0)

_24 = ID3Header()
_24.version = (2, 4, 0)


class TVariousFrames(TestCase):

    DATA = [
        ['TALB', b'\x00a/b', 'a/b', '', dict(encoding=0)],
        ['TBPM', b'\x00120', '120', 120, dict(encoding=0)],
        ['TCMP', b'\x001', '1', 1, dict(encoding=0)],
        ['TCMP', b'\x000', '0', 0, dict(encoding=0)],
        ['TCOM', b'\x00a/b', 'a/b', '', dict(encoding=0)],
        ['TCON', b'\x00(21)Disco', '(21)Disco', '', dict(encoding=0)],
        ['TCOP', b'\x001900 c', '1900 c', '', dict(encoding=0)],
        ['TDAT', b'\x00a/b', 'a/b', '', dict(encoding=0)],
        ['TDEN', b'\x001987', '1987', '', dict(encoding=0, year=[1987])],
        [
            'TDOR', b'\x001987-12', '1987-12', '',
            dict(encoding=0, year=[1987], month=[12])
        ],
        ['TDRC', b'\x001987\x00', '1987', '', dict(encoding=0, year=[1987])],
        [
            'TDRL', b'\x001987\x001988', '1987,1988', '',
            dict(encoding=0, year=[1987, 1988])
        ],
        ['TDTG', b'\x001987', '1987', '', dict(encoding=0, year=[1987])],
        ['TDLY', b'\x001205', '1205', 1205, dict(encoding=0)],
        ['TENC', b'\x00a b/c d', 'a b/c d', '', dict(encoding=0)],
        ['TEXT', b'\x00a b\x00c d', ['a b', 'c d'], '', dict(encoding=0)],
        ['TFLT', b'\x00MPG/3', 'MPG/3', '', dict(encoding=0)],
        ['TIME', b'\x001205', '1205', '', dict(encoding=0)],
        [
            'TIPL', b'\x02\x00a\x00\x00\x00b', [["a", "b"]], '',
            dict(encoding=2)
        ],
        ['TIT1', b'\x00a/b', 'a/b', '', dict(encoding=0)],
        # TIT2 checks misaligned terminator '\x00\x00' across crosses utf16
        # chars
        [
            'TIT2', b'\x01\xff\xfe\x38\x00\x00\x38', u'8\u3800', '',
            dict(encoding=1)
        ],
        ['TIT3', b'\x00a/b', 'a/b', '', dict(encoding=0)],
        ['TKEY', b'\x00A#m', 'A#m', '', dict(encoding=0)],
        ['TLAN', b'\x006241', '6241', '', dict(encoding=0)],
        ['TLEN', b'\x006241', '6241', 6241, dict(encoding=0)],
        [
            'TMCL', b'\x02\x00a\x00\x00\x00b', [["a", "b"]], '',
            dict(encoding=2)
        ],
        ['TMED', b'\x00med', 'med', '', dict(encoding=0)],
        ['TMOO', b'\x00moo', 'moo', '', dict(encoding=0)],
        ['TOAL', b'\x00alb', 'alb', '', dict(encoding=0)],
        ['TOFN', b'\x0012 : bar', '12 : bar', '', dict(encoding=0)],
        ['TOLY', b'\x00lyr', 'lyr', '', dict(encoding=0)],
        ['TOPE', b'\x00own/lic', 'own/lic', '', dict(encoding=0)],
        ['TORY', b'\x001923', '1923', 1923, dict(encoding=0)],
        ['TOWN', b'\x00own/lic', 'own/lic', '', dict(encoding=0)],
        ['TPE1', b'\x00ab', ['ab'], '', dict(encoding=0)],
        [
            'TPE2', b'\x00ab\x00cd\x00ef', ['ab', 'cd', 'ef'], '',
            dict(encoding=0)
        ],
        ['TPE3', b'\x00ab\x00cd', ['ab', 'cd'], '', dict(encoding=0)],
        ['TPE4', b'\x00ab\x00', ['ab'], '', dict(encoding=0)],
        ['TPOS', b'\x0008/32', '08/32', 8, dict(encoding=0)],
        ['TPRO', b'\x00pro', 'pro', '', dict(encoding=0)],
        ['TPUB', b'\x00pub', 'pub', '', dict(encoding=0)],
        ['TRCK', b'\x004/9', '4/9', 4, dict(encoding=0)],
        ['TRDA', b'\x00Sun Jun 12', 'Sun Jun 12', '', dict(encoding=0)],
        ['TRSN', b'\x00ab/cd', 'ab/cd', '', dict(encoding=0)],
        ['TRSO', b'\x00ab', 'ab', '', dict(encoding=0)],
        ['TSIZ', b'\x0012345', '12345', 12345, dict(encoding=0)],
        ['TSOA', b'\x00ab', 'ab', '', dict(encoding=0)],
        ['TSOP', b'\x00ab', 'ab', '', dict(encoding=0)],
        ['TSOT', b'\x00ab', 'ab', '', dict(encoding=0)],
        ['TSO2', b'\x00ab', 'ab', '', dict(encoding=0)],
        ['TSOC', b'\x00ab', 'ab', '', dict(encoding=0)],
        ['TSRC', b'\x0012345', '12345', '', dict(encoding=0)],
        ['TSSE', b'\x0012345', '12345', '', dict(encoding=0)],
        ['TSST', b'\x0012345', '12345', '', dict(encoding=0)],
        ['TYER', b'\x002004', '2004', 2004, dict(encoding=0)],
        ['MVNM', b'\x00ab\x00', 'ab', '', dict(encoding=0)],
        ['MVIN', b'\x001/3\x00', '1/3', 1, dict(encoding=0)],
        ['GRP1', b'\x00ab\x00', 'ab', '', dict(encoding=0)],
        [
            'TXXX', b'\x00usr\x00a/b\x00c', ['a/b', 'c'], '',
            dict(encoding=0, desc='usr')
        ],
        ['WCOM', b'http://foo', 'http://foo', '', {}],
        ['WCOP', b'http://bar', 'http://bar', '', {}],
        ['WOAF', b'http://baz', 'http://baz', '', {}],
        ['WOAR', b'http://bar', 'http://bar', '', {}],
        ['WOAS', b'http://bar', 'http://bar', '', {}],
        ['WORS', b'http://bar', 'http://bar', '', {}],
        ['WPAY', b'http://bar', 'http://bar', '', {}],
        ['WPUB', b'http://bar', 'http://bar', '', {}],
        ['WXXX', b'\x00usr\x00http', 'http', '', dict(encoding=0, desc='usr')],
        [
            'IPLS', b'\x00a\x00A\x00b\x00B\x00', [['a', 'A'], ['b', 'B']], '',
            dict(encoding=0)
        ],
        ['MCDI', b'\x01\x02\x03\x04', b'\x01\x02\x03\x04', '', {}],
        [
            'ETCO', b'\x01\x12\x00\x00\x7f\xff', [(18, 32767)], '',
            dict(format=1)
        ],
        [
            'COMM', b'\x00ENUT\x00Com', 'Com', '',
            dict(desc='T', lang='ENU', encoding=0)
        ],
        [
            'APIC', b'\x00-->\x00\x03cover\x00cover.jpg', b'cover.jpg', '',
            dict(mime='-->', type=3, desc='cover', encoding=0)
        ],
        ['USER', b'\x00ENUCom', 'Com', '', dict(lang='ENU', encoding=0)],
        [
            'RVA2', b'testdata\x00\x01\xfb\x8c\x10\x12\x23',
            'Master volume: -2.2266 dB/0.1417', '',
            dict(desc='testdata', channel=1, gain=-2.22656, peak=0.14169)
        ],
        [
            'RVA2', b'testdata\x00\x01\xfb\x8c\x24\x01\x22\x30\x00\x00',
            'Master volume: -2.2266 dB/0.1417', '',
            dict(desc='testdata', channel=1, gain=-2.22656, peak=0.14169)
        ],
        [
            'RVA2', b'testdata2\x00\x01\x04\x01\x00',
            'Master volume: +2.0020 dB/0.0000', '',
            dict(desc='testdata2', channel=1, gain=2.001953125, peak=0)
        ],
        ['PCNT', b'\x00\x00\x00\x11', 17, 17, dict(count=17)],
        [
            'POPM', b'foo@bar.org\x00\xde\x00\x00\x00\x11', 222, 222,
            dict(email="foo@bar.org", rating=222, count=17)
        ],
        [
            'POPM', b'foo@bar.org\x00\xde\x00', 222, 222,
            dict(email="foo@bar.org", rating=222, count=0)
        ],
        # Issue #33 - POPM may have no playcount at all.
        [
            'POPM', b'foo@bar.org\x00\xde', 222, 222,
            dict(email="foo@bar.org", rating=222)
        ],
        ['UFID', b'own\x00data', b'data', '', dict(data=b'data', owner='own')],
        ['UFID', b'own\x00\xdd', b'\xdd', '', dict(data=b'\xdd', owner='own')],
        [
            'GEOB', b'\x00mime\x00name\x00desc\x00data', b'data', '',
            dict(encoding=0, mime='mime', filename='name', desc='desc')
        ],
        [
            'USLT', b'\x00engsome lyrics\x00woo\nfun', 'woo\nfun', '',
            dict(encoding=0, lang='eng', desc='some lyrics', text='woo\nfun')
        ],
        [
            'SYLT', (b'\x00eng\x02\x01some lyrics\x00foo\x00\x00\x00\x00\x01'
                     b'bar\x00\x00\x00\x00\x10'), "foobar", '',
            dict(encoding=0, lang='eng', type=1, format=2, desc='some lyrics')
        ],
        ['POSS', b'\x01\x0f', 15, 15, dict(format=1, position=15)],
        [
            'OWNE', b'\x00USD10.01\x0020041010CDBaby', 'CDBaby', 'CDBaby',
            dict(encoding=0, price="USD10.01", date='20041010',
                 seller='CDBaby')
        ],
        [
            'PRIV', b'a@b.org\x00random data', b'random data', 'random data',
            dict(owner='a@b.org', data=b'random data')
        ],
        [
            'PRIV', b'a@b.org\x00\xdd', b'\xdd', '\xdd',
            dict(owner='a@b.org', data=b'\xdd')
        ],
        ['SIGN', b'\x92huh?', b'huh?', 'huh?', dict(group=0x92, sig=b'huh?')],
        [
            'ENCR', b'a@b.org\x00\x92Data!', b'Data!', 'Data!',
            dict(owner='a@b.org', method=0x92, data=b'Data!')
        ],
        [
            'SEEK', b'\x00\x12\x00\x56',
            0x12 * 256 * 256 + 0x56, 0x12 * 256 * 256 + 0x56,
            dict(offset=0x12 * 256 * 256 + 0x56)
        ],
        [
            'SYTC', b"\x01\x10obar", b'\x10obar', '',
            dict(format=1, data=b'\x10obar')
        ],
        [
            'RBUF', b'\x00\x12\x00', 0x12 * 256, 0x12 * 256,
            dict(size=0x12 * 256)
        ],
        [
            'RBUF', b'\x00\x12\x00\x01', 0x12 * 256, 0x12 * 256,
            dict(size=0x12 * 256, info=1)
        ],
        [
            'RBUF', b'\x00\x12\x00\x01\x00\x00\x00\x23',
            0x12 * 256, 0x12 * 256,
            dict(size=0x12 * 256, info=1, offset=0x23)
        ],
        [
            'RVRB', b'\x12\x12\x23\x23\x0a\x0b\x0c\x0d\x0e\x0f\x10\x11',
            (0x12 * 256 + 0x12, 0x23 * 256 + 0x23), '',
            dict(left=0x12 * 256 + 0x12, right=0x23 * 256 + 0x23)
        ],
        [
            'AENC', b'a@b.org\x00\x00\x12\x00\x23', 'a@b.org', 'a@b.org',
            dict(owner='a@b.org', preview_start=0x12, preview_length=0x23)
        ],
        [
            'AENC', b'a@b.org\x00\x00\x12\x00\x23!', 'a@b.org', 'a@b.org',
            dict(owner='a@b.org', preview_start=0x12,
                 preview_length=0x23, data=b'!')
        ],
        [
            'GRID', b'a@b.org\x00\x99', 'a@b.org', 0x99,
            dict(owner='a@b.org', group=0x99)
        ],
        [
            'GRID', b'a@b.org\x00\x99data', 'a@b.org', 0x99,
            dict(owner='a@b.org', group=0x99, data=b'data')
        ],
        [
            'COMR',
            (b'\x00USD10.00\x0020051010ql@sc.net\x00\x09Joe\x00A song\x00'
             b'x-image/fake\x00some data'),
            COMR(encoding=0, price="USD10.00", valid_until="20051010",
                 contact="ql@sc.net", format=9, seller="Joe", desc="A song",
                 mime='x-image/fake', logo=b'some data'), '',
            dict(encoding=0, price="USD10.00", valid_until="20051010",
                 contact="ql@sc.net", format=9, seller="Joe", desc="A song",
                 mime='x-image/fake', logo=b'some data')
        ],
        [
            'COMR',
            b'\x00USD10.00\x0020051010ql@sc.net\x00\x09Joe\x00A song\x00',
            COMR(encoding=0, price="USD10.00", valid_until="20051010",
                 contact="ql@sc.net", format=9, seller="Joe", desc="A song"),
            '',
            dict(encoding=0, price="USD10.00", valid_until="20051010",
                 contact="ql@sc.net", format=9, seller="Joe", desc="A song")
        ],
        [
            'MLLT', b'\x00\x01\x00\x00\x02\x00\x00\x03\x04\x08foobar',
            b'foobar', '',
            dict(frames=1, bytes=2, milliseconds=3, bits_for_bytes=4,
                 bits_for_milliseconds=8, data=b'foobar')
        ],
        [
            'EQU2', b'\x00Foobar\x00\x01\x01\x04\x00', [(128.5, 2.0)], '',
            dict(method=0, desc="Foobar")
        ],
        [
            'ASPI',
            b'\x00\x00\x00\x00\x00\x00\x00\x10\x00\x03\x08\x01\x02\x03',
            [1, 2, 3], '', dict(S=0, L=16, N=3, b=8)
        ],
        [
            'ASPI', b'\x00\x00\x00\x00\x00\x00\x00\x10\x00\x03\x10'
            b'\x00\x01\x00\x02\x00\x03', [1, 2, 3], '',
            dict(S=0, L=16, N=3, b=16)
        ],
        [
            'LINK', b'TIT1http://www.example.org/TIT1.txt\x00',
            ("TIT1", 'http://www.example.org/TIT1.txt', b''), '',
            dict(frameid='TIT1', url='http://www.example.org/TIT1.txt',
                 data=b'')
        ],
        [
            'LINK', b'COMMhttp://www.example.org/COMM.txt\x00engfoo',
            ("COMM", 'http://www.example.org/COMM.txt', b'engfoo'), '',
            dict(frameid='COMM', url='http://www.example.org/COMM.txt',
                 data=b'engfoo')
        ],
        # iTunes podcast frames
        ['TGID', b'\x00i', u'i', '', dict(encoding=0)],
        ['TDES', b'\x00ii', u'ii', '', dict(encoding=0)],
        ['TKWD', b'\x00ii', u'ii', '', dict(encoding=0)],
        ['TCAT', b'\x00ii', u'ii', '', dict(encoding=0)],
        ['WFED', b'http://zzz', 'http://zzz', '', {}],
        ['PCST', b'\x00\x00\x00\x00', 0, 0, dict(value=0)],

        # Chapter extension
        ['CHAP', (b'foo\x00\x11\x11\x11\x11\x22\x22\x22\x22'
                  b'\x33\x33\x33\x33\x44\x44\x44\x44'),
         CHAP(element_id=u'foo', start_time=286331153, end_time=572662306,
              start_offset=858993459, end_offset=1145324612), '', dict()],
        ['CTOC', b'foo\x00\x03\x01bla\x00',
         CTOC(element_id=u'foo',
              flags=CTOCFlags.ORDERED | CTOCFlags.TOP_LEVEL,
              child_element_ids=[u'bla']),
         '', dict()],

        ['RVAD', b'\x03\x10\x00\x00\x00\x00',
         RVAD(adjustments=[0, 0]), '', dict()],
        ['RVAD', b'\x03\x08\x00\x01\x02\x03\x04\x05\x06\x07\x00\x00\x00\x00',
         RVAD(adjustments=[0, 1, 2, 3, -4, -5, 6, 7, 0, 0, 0, 0]), '', dict()],

        # 2.2 tags
        ['RVA', b'\x03\x10\x00\x00\x00\x00',
         RVA(adjustments=[0, 0]), '', dict()],
        ['UFI', b'own\x00data', b'data', '', dict(data=b'data', owner='own')],
        [
            'SLT', (b'\x00eng\x02\x01some lyrics\x00foo\x00\x00\x00\x00\x01bar'
                    b'\x00\x00\x00\x00\x10'),
            "foobar", '',
            dict(encoding=0, lang='eng', type=1, format=2, desc='some lyrics')
        ],
        ['TT1', b'\x00ab\x00', 'ab', '', dict(encoding=0)],
        ['TT2', b'\x00ab', 'ab', '', dict(encoding=0)],
        ['TT3', b'\x00ab', 'ab', '', dict(encoding=0)],
        ['TP1', b'\x00ab\x00', 'ab', '', dict(encoding=0)],
        ['TP2', b'\x00ab', 'ab', '', dict(encoding=0)],
        ['TP3', b'\x00ab', 'ab', '', dict(encoding=0)],
        ['TP4', b'\x00ab', 'ab', '', dict(encoding=0)],
        ['TCM', b'\x00ab/cd', 'ab/cd', '', dict(encoding=0)],
        ['TXT', b'\x00lyr', 'lyr', '', dict(encoding=0)],
        ['TLA', b'\x00ENU', 'ENU', '', dict(encoding=0)],
        ['TCO', b'\x00gen', 'gen', '', dict(encoding=0)],
        ['TAL', b'\x00alb', 'alb', '', dict(encoding=0)],
        ['TPA', b'\x001/9', '1/9', 1, dict(encoding=0)],
        ['TRK', b'\x002/8', '2/8', 2, dict(encoding=0)],
        ['TRC', b'\x00isrc', 'isrc', '', dict(encoding=0)],
        ['TYE', b'\x001900', '1900', 1900, dict(encoding=0)],
        ['TDA', b'\x002512', '2512', '', dict(encoding=0)],
        ['TIM', b'\x001225', '1225', '', dict(encoding=0)],
        ['TRD', b'\x00Jul 17', 'Jul 17', '', dict(encoding=0)],
        ['TMT', b'\x00DIG/A', 'DIG/A', '', dict(encoding=0)],
        ['TFT', b'\x00MPG/3', 'MPG/3', '', dict(encoding=0)],
        ['TBP', b'\x00133', '133', 133, dict(encoding=0)],
        ['TCP', b'\x001', '1', 1, dict(encoding=0)],
        ['TCP', b'\x000', '0', 0, dict(encoding=0)],
        ['TCR', b'\x00Me', 'Me', '', dict(encoding=0)],
        ['TPB', b'\x00Him', 'Him', '', dict(encoding=0)],
        ['TEN', b'\x00Lamer', 'Lamer', '', dict(encoding=0)],
        ['TSS', b'\x00ab', 'ab', '', dict(encoding=0)],
        ['TOF', b'\x00ab:cd', 'ab:cd', '', dict(encoding=0)],
        ['TLE', b'\x0012', '12', 12, dict(encoding=0)],
        ['TSI', b'\x0012', '12', 12, dict(encoding=0)],
        ['TDY', b'\x0012', '12', 12, dict(encoding=0)],
        ['TKE', b'\x00A#m', 'A#m', '', dict(encoding=0)],
        ['TOT', b'\x00org', 'org', '', dict(encoding=0)],
        ['TOA', b'\x00org', 'org', '', dict(encoding=0)],
        ['TOL', b'\x00org', 'org', '', dict(encoding=0)],
        ['TOR', b'\x001877', '1877', 1877, dict(encoding=0)],
        ['TXX', b'\x00desc\x00val', 'val', '', dict(encoding=0, desc='desc')],
        ['TSC', b'\x00ab', 'ab', '', dict(encoding=0)],
        ['TSA', b'\x00ab', 'ab', '', dict(encoding=0)],
        ['TS2', b'\x00ab', 'ab', '', dict(encoding=0)],
        ['TST', b'\x00ab', 'ab', '', dict(encoding=0)],
        ['TSP', b'\x00ab', 'ab', '', dict(encoding=0)],
        ['MVN', b'\x00ab\x00', 'ab', '', dict(encoding=0)],
        ['MVI', b'\x001/3\x00', '1/3', 1, dict(encoding=0)],
        ['GP1', b'\x00ab\x00', 'ab', '', dict(encoding=0)],

        ['WAF', b'http://zzz', 'http://zzz', '', {}],
        ['WAR', b'http://zzz', 'http://zzz', '', {}],
        ['WAS', b'http://zzz', 'http://zzz', '', {}],
        ['WCM', b'http://zzz', 'http://zzz', '', {}],
        ['WCP', b'http://zzz', 'http://zzz', '', {}],
        ['WPB', b'http://zzz', 'http://zzz', '', {}],
        [
            'WXX', b'\x00desc\x00http', 'http', '',
            dict(encoding=0, desc='desc')
        ],
        [
            'IPL', b'\x00a\x00A\x00b\x00B\x00', [['a', 'A'], ['b', 'B']], '',
            dict(encoding=0)
        ],
        ['MCI', b'\x01\x02\x03\x04', b'\x01\x02\x03\x04', '', {}],
        [
            'ETC', b'\x01\x12\x00\x00\x7f\xff', [(18, 32767)], '',
            dict(format=1)
        ],
        [
            'COM', b'\x00ENUT\x00Com', 'Com', '',
            dict(desc='T', lang='ENU', encoding=0)
        ],
        [
            'PIC', b'\x00-->\x03cover\x00cover.jpg', b'cover.jpg', '',
            dict(mime='-->', type=3, desc='cover', encoding=0)
        ],
        [
            'POP', b'foo@bar.org\x00\xde\x00\x00\x00\x11', 222, 222,
            dict(email="foo@bar.org", rating=222, count=17)
        ],
        ['CNT', b'\x00\x00\x00\x11', 17, 17, dict(count=17)],
        [
            'GEO', b'\x00mime\x00name\x00desc\x00data', b'data', '',
            dict(encoding=0, mime='mime', filename='name', desc='desc')
        ],
        [
            'ULT', b'\x00engsome lyrics\x00woo\nfun', 'woo\nfun', '',
            dict(encoding=0, lang='eng', desc='some lyrics', text='woo\nfun')],
        [
            'BUF', b'\x00\x12\x00', 0x12 * 256, 0x12 * 256,
            dict(size=0x12 * 256)
        ],
        [
            'CRA', b'a@b.org\x00\x00\x12\x00\x23', 'a@b.org', 'a@b.org',
            dict(owner='a@b.org', preview_start=0x12, preview_length=0x23)
        ],
        [
            'CRA', b'a@b.org\x00\x00\x12\x00\x23!', 'a@b.org', 'a@b.org',
            dict(owner='a@b.org', preview_start=0x12,
                 preview_length=0x23, data=b'!')
        ],
        [
            'REV', b'\x12\x12\x23\x23\x0a\x0b\x0c\x0d\x0e\x0f\x10\x11',
            (0x12 * 256 + 0x12, 0x23 * 256 + 0x23), '',
            dict(left=0x12 * 256 + 0x12, right=0x23 * 256 + 0x23)
        ],
        [
            'STC', b"\x01\x10obar", b'\x10obar', '',
            dict(format=1, data=b'\x10obar')
        ],
        [
            'MLL', b'\x00\x01\x00\x00\x02\x00\x00\x03\x04\x08foobar',
            b'foobar', '',
            dict(frames=1, bytes=2, milliseconds=3, bits_for_bytes=4,
                 bits_for_milliseconds=8, data=b'foobar')
        ],
        [
            'LNK', b'TT1http://www.example.org/TIT1.txt\x00',
            ("TT1", 'http://www.example.org/TIT1.txt', b''), '',
            dict(frameid='TT1', url='http://www.example.org/TIT1.txt',
                 data=b'')
        ],
        [
            'CRM', b'foo@example.org\x00test\x00woo', b'woo', '',
            dict(owner='foo@example.org', desc='test', data=b'woo')
        ],
        [
            'CRM', b'\x00\x00', b'', '',
            dict(owner='', desc='', data=b'')
        ],
    ]

    def _get_frame(self, id_):
        return getattr(getattr(__import__('mutagen.id3'), "id3"), id_)

    def test_all_tested(self):
        check = dict.fromkeys(list(Frames.keys()) + list(Frames_2_2.keys()))
        tested = [l[0] for l in self.DATA]
        for t in tested:
            check.pop(t, None)
        self.assertEqual(list(check.keys()), [])

    def test_tag_repr(self):
        for frame_id, data, value, intval, info in self.DATA:
            kind = self._get_frame(frame_id)
            tag = kind._fromData(_23, 0, data)
            self.assertTrue(isinstance(tag.__str__(), str))
            self.assertTrue(isinstance(tag.__repr__(), str))
            if PY2:
                if hasattr(tag, "__unicode__"):
                    self.assertTrue(isinstance(tag.__unicode__(), unicode))
            else:
                if hasattr(tag, "__bytes__"):
                    self.assertTrue(isinstance(tag.__bytes__(), bytes))

    def test_tag_write(self):
        for frame_id, data, value, intval, info in self.DATA:
            kind = self._get_frame(frame_id)
            tag = kind._fromData(_24, 0, data)
            towrite = tag._writeData()
            tag2 = kind._fromData(_24, 0, towrite)
            for spec in kind._framespec:
                attr = spec.name
                self.assertEquals(getattr(tag, attr), getattr(tag2, attr))
            for spec in kind._optionalspec:
                attr = spec.name
                other = object()
                self.assertEquals(
                    getattr(tag, attr, other), getattr(tag2, attr, other))

    def test_tag_write_v23(self):
        for frame_id, data, value, intval, info in self.DATA:
            kind = self._get_frame(frame_id)
            tag = kind._fromData(_24, 0, data)
            config = ID3SaveConfig(3, "/")
            towrite = tag._writeData(config)
            tag2 = kind._fromData(_23, 0, towrite)
            tag3 = kind._fromData(_23, 0, tag2._writeData(config))
            for spec in kind._framespec:
                attr = spec.name
                self.assertEquals(getattr(tag2, attr), getattr(tag3, attr))
            for spec in kind._optionalspec:
                attr = spec.name
                other = object()
                self.assertEquals(
                    getattr(tag2, attr, other), getattr(tag3, attr, other))
                self.assertEqual(hasattr(tag, attr), hasattr(tag2, attr))

    def test_tag(self):
        for frame_id, data, value, intval, info in self.DATA:
            kind = self._get_frame(frame_id)
            tag = kind._fromData(_23, 0, data)
            self.failUnless(tag.HashKey)
            self.failUnless(tag.pprint())
            self.assertEquals(value, tag)
            if 'encoding' not in info:
                self.assertRaises(AttributeError, getattr, tag, 'encoding')
            for attr, value in iteritems(info):
                t = tag
                if not isinstance(value, list):
                    value = [value]
                    t = [t]
                for value, t in izip(value, iter(t)):
                    if isinstance(value, float):
                        self.failUnlessAlmostEqual(value, getattr(t, attr), 5)
                    else:
                        self.assertEquals(value, getattr(t, attr))

                    if isinstance(intval, integer_types):
                        self.assertEquals(intval, operator.pos(t))
                    else:
                        self.assertRaises(TypeError, operator.pos, t)


class TPCST(TestCase):

    def test_default(self):
        frame = PCST()
        self.assertEqual(frame.value, 0)


class TETCO(TestCase):

    def test_default(self):
        frame = ETCO()
        self.assertEqual(frame.format, 1)
        self.assertEqual(frame.events, [])

    def test_default_mutable(self):
        frame = ETCO()
        frame.events.append(1)
        self.assertEqual(ETCO().events, [])


class TSYTC(TestCase):

    def test_default(self):
        frame = SYTC()
        self.assertEqual(frame.format, 1)
        self.assertEqual(frame.data, b"")


class TCRA(TestCase):

    def test_upgrade(self):
        frame = CRA(owner="a", preview_start=1, preview_length=2, data=b"foo")
        new = AENC(frame)
        self.assertEqual(new.owner, "a")
        self.assertEqual(new.preview_start, 1)
        self.assertEqual(new.preview_length, 2)
        self.assertEqual(new.data, b"foo")


class TPIC(TestCase):

    def test_default(self):
        frame = PIC()
        self.assertEqual(frame.encoding, 1)
        self.assertEqual(frame.mime, u"JPG")
        self.assertEqual(frame.type, PictureType.COVER_FRONT)
        self.assertEqual(frame.desc, u"")
        self.assertEqual(frame.data, b"")

    def test_upgrade(self):
        frame = PIC(encoding=0, mime="PNG", desc="bla", type=3, data=b"\x00")
        new = APIC(frame)
        self.assertEqual(new.encoding, 0)
        self.assertEqual(new.mime, "PNG")
        self.assertEqual(new.desc, "bla")
        self.assertEqual(new.data, b"\x00")

        frame = PIC(encoding=0, mime="foo",
                    desc="bla", type=3, data=b"\x00")
        self.assertEqual(frame.mime, "foo")
        new = APIC(frame)
        self.assertEqual(new.mime, "foo")


class TLNK(TestCase):

    def test_default(self):
        frame = LNK()
        self.assertEqual(frame.frameid, u"XXX")
        self.assertEqual(frame.url, u"")

    def test_upgrade(self):
        url = "http://foo.bar"

        frame = LNK(frameid="PIC", url=url, data=b"\x00")
        new = LINK(frame)
        self.assertEqual(new.frameid, "APIC")
        self.assertEqual(new.url, url)
        self.assertEqual(new.data, b"\x00")

        frame = LNK(frameid="XYZ")
        new = LINK(frame)
        self.assertEqual(new.frameid, "XYZ ")


class TSIGN(TestCase):

    def test_default(self):
        frame = SIGN()
        self.assertEqual(frame.group, 0x80)
        self.assertEqual(frame.sig, b"")

    def test_hash(self):
        frame = SIGN(group=1, sig=b"foo")
        self.assertEqual(frame.HashKey, "SIGN:1:foo")

    def test_pprint(self):
        frame = SIGN(group=1, sig=b"foo")
        frame._pprint()


class TCRM(TestCase):

    def test_default(self):
        frame = CRM()
        self.assertEqual(frame.owner, u"")
        self.assertEqual(frame.desc, u"")
        self.assertEqual(frame.data, b"")


class TPRIV(TestCase):

    def test_default(self):
        frame = PRIV()
        self.assertEqual(frame.owner, u"")
        self.assertEqual(frame.data, b"")

    def test_hash(self):
        frame = PRIV(owner="foo", data=b"foo")
        self.assertEqual(frame.HashKey, "PRIV:foo:foo")
        frame._pprint()

        frame = PRIV(owner="foo", data=b"\x00\xff")
        self.assertEqual(frame.HashKey, u"PRIV:foo:\x00\xff")
        frame._pprint()


class TGRID(TestCase):

    def test_default(self):
        frame = GRID()
        self.assertEqual(frame.owner, u"")
        self.assertEqual(frame.group, 0x80)

    def test_hash(self):
        frame = GRID(owner="foo", group=42)
        self.assertEqual(frame.HashKey, "GRID:42")
        frame._pprint()


class TENCR(TestCase):

    def test_default(self):
        frame = ENCR()
        self.assertEqual(frame.owner, u"")
        self.assertEqual(frame.method, 0x80)
        self.assertEqual(frame.data, b"")

    def test_hash(self):
        frame = ENCR(owner="foo", method=42, data=b"\xff")
        self.assertEqual(frame.HashKey, "ENCR:foo")
        frame._pprint()


class TOWNE(TestCase):

    def test_default(self):
        frame = OWNE()
        self.assertEqual(frame.encoding, 1)
        self.assertEqual(frame.price, u"")
        self.assertEqual(frame.date, u"19700101")
        self.assertEqual(frame.seller, u"")


class TCOMR(TestCase):

    def test_default(self):
        frame = COMR()
        self.assertEqual(frame.encoding, 1)
        self.assertEqual(frame.price, u"")
        self.assertEqual(frame.valid_until, u"19700101")
        self.assertEqual(frame.contact, u"")
        self.assertEqual(frame.format, 0)
        self.assertEqual(frame.seller, u"")
        self.assertEqual(frame.desc, u"")

    def test_hash(self):
        frame = COMR(
            encoding=0, price="p", valid_until="v" * 8, contact="c",
            format=42, seller="s", desc="d", mime="m", logo=b"\xff")
        self.assertEqual(
            frame.HashKey, u"COMR:\x00p\x00vvvvvvvvc\x00*s\x00d\x00m\x00\xff")
        frame._pprint()


class TBinaryFrame(TestCase):

    def test_default(self):
        frame = BinaryFrame()
        self.assertEqual(frame.data, b"")


class TUSER(TestCase):

    def test_default(self):
        frame = USER()
        self.assertEqual(frame.encoding, 1)
        self.assertEqual(frame.lang, u"XXX")
        self.assertEqual(frame.text, u"")

    def test_hash(self):
        frame = USER(encoding=0, lang="foo", text="bla")
        self.assertEqual(frame.HashKey, "USER:foo")
        frame._pprint()

        self.assertEquals(USER(text="a").HashKey, USER(text="b").HashKey)
        self.assertNotEquals(
            USER(lang="abc").HashKey, USER(lang="def").HashKey)


class TMLLT(TestCase):

    def test_default(self):
        frame = MLLT()
        self.assertEqual(frame.frames, 0)
        self.assertEqual(frame.bytes, 0)
        self.assertEqual(frame.milliseconds, 0)
        self.assertEqual(frame.bits_for_bytes, 0)
        self.assertEqual(frame.bits_for_milliseconds, 0)
        self.assertEqual(frame.data, b"")


class TTIT2(TestCase):

    def test_hash(self):
        self.assertEquals(TIT2(text="a").HashKey, TIT2(text="b").HashKey)


class TUFID(TestCase):

    def test_default(self):
        frame = UFID()
        self.assertEqual(frame.owner, u"")
        self.assertEqual(frame.data, b"")

    def test_hash(self):
        frame = UFID(owner="foo", data=b"\x42")
        self.assertEqual(frame.HashKey, "UFID:foo")
        frame._pprint()

        self.assertEquals(UFID(data=b"1").HashKey, UFID(data=b"2").HashKey)
        self.assertNotEquals(UFID(owner="a").HashKey, UFID(owner="b").HashKey)


class TPairedTextFrame(TestCase):

    def test_default(self):
        frame = PairedTextFrame()
        self.assertEqual(frame.encoding, 1)
        self.assertEqual(frame.people, [])


class TRVAD(TestCase):

    def test_default(self):
        frame = RVAD()
        self.assertEqual(frame.adjustments, [0, 0])

    def test_hash(self):
        frame = RVAD()
        self.assertEqual(frame.HashKey, "RVAD")

    def test_upgrade(self):
        rva = RVA(adjustments=[1, 2])
        self.assertEqual(RVAD(rva).adjustments, [1, 2])


class TLINK(TestCase):

    def test_read(self):
        frame = LINK()
        frame._readData(_24, b"XXX\x00Foo\x00")
        # either we can read invalid frame ids or we fail properly, atm we read
        # them.
        self.assertEqual(frame.frameid, "XXX\x00")

    def test_default(self):
        frame = LINK()
        self.assertEqual(frame.frameid, u"XXXX")
        self.assertEqual(frame.url, u"")

    def test_hash(self):
        frame = LINK(frameid="TPE1", url="http://foo.bar", data=b"\x42")
        self.assertEqual(frame.HashKey, "LINK:TPE1:http://foo.bar:B")
        frame._pprint()

        frame = LINK(frameid="TPE1", url="http://foo.bar")
        self.assertEqual(frame.HashKey, "LINK:TPE1:http://foo.bar:")


class TAENC(TestCase):

    def test_default(self):
        frame = AENC()
        self.assertEqual(frame.owner, u"")
        self.assertEqual(frame.preview_start, 0)
        self.assertEqual(frame.preview_length, 0)

    def test_hash(self):
        frame = AENC(
            owner="foo", preview_start=1, preview_length=2, data=b"\x42")
        self.assertEqual(frame.HashKey, "AENC:foo")
        frame._pprint()


class TGEOB(TestCase):

    def test_default(self):
        frame = GEOB()
        self.assertEqual(frame.encoding, 1)
        self.assertEqual(frame.mime, u"")
        self.assertEqual(frame.filename, u"")
        self.assertEqual(frame.desc, u"")
        self.assertEqual(frame.data, b"")

    def test_hash(self):
        frame = GEOB(
            encoding=0, mtime="m", filename="f", desc="d", data=b"\x42")
        self.assertEqual(frame.HashKey, "GEOB:d")
        frame._pprint()

        self.assertEquals(GEOB(data=b"1").HashKey, GEOB(data=b"2").HashKey)
        self.assertNotEquals(GEOB(desc="a").HashKey, GEOB(desc="b").HashKey)


class TPOPM(TestCase):

    def test_default(self):
        frame = POPM()
        self.assertEqual(frame.email, u"")
        self.assertEqual(frame.rating, 0)
        self.assertFalse(hasattr(frame, "count"))

    def test_hash(self):
        frame = POPM(email="e", rating=42)
        self.assertEqual(frame.HashKey, "POPM:e")
        frame._pprint()

        self.assertEquals(POPM(count=1).HashKey, POPM(count=2).HashKey)
        self.assertNotEquals(POPM(email="a").HashKey, POPM(email="b").HashKey)


class TEQU2(TestCase):

    def test_default(self):
        frame = EQU2()
        self.assertEqual(frame.method, 0)
        self.assertEqual(frame.desc, u"")
        self.assertEqual(frame.adjustments, [])

    def test_default_mutable(self):
        frame = EQU2()
        frame.adjustments.append(1)
        self.assertEqual(EQU2(), [])

    def test_hash(self):
        frame = EQU2(method=42, desc="d", adjustments=[(0, 0)])
        self.assertEqual(frame.HashKey, "EQU2:d")
        frame._pprint()


class TSEEK(TestCase):

    def test_default(self):
        frame = SEEK()
        self.assertEqual(frame.offset, 0)


class TPOSS(TestCase):

    def test_default(self):
        frame = POSS()
        self.assertEqual(frame.format, 1)
        self.assertEqual(frame.position, 0)


class TCOMM(TestCase):

    def test_default(self):
        frame = COMM()
        self.assertEqual(frame.encoding, 1)
        self.assertEqual(frame.lang, u"XXX")
        self.assertEqual(frame.desc, u"")
        self.assertEqual(frame.text, [])

    def test_hash(self):
        frame = COMM(encoding=0, lang="foo", desc="d")
        self.assertEqual(frame.HashKey, "COMM:d:foo")
        frame._pprint()

        self.assertEquals(COMM(text="a").HashKey, COMM(text="b").HashKey)
        self.assertNotEquals(COMM(desc="a").HashKey, COMM(desc="b").HashKey)
        self.assertNotEquals(
            COMM(lang="abc").HashKey, COMM(lang="def").HashKey)

    def test_bad_unicodedecode(self):
        # 7 bytes of "UTF16" data.
        data = b'\x01\x00\x00\x00\xff\xfe\x00\xff\xfeh\x00'
        self.assertRaises(ID3JunkFrameError, COMM._fromData, _24, 0x00, data)


class TSYLT(TestCase):

    def test_default(self):
        frame = SYLT()
        self.assertEqual(frame.encoding, 1)
        self.assertEqual(frame.lang, u"XXX")
        self.assertEqual(frame.format, 1)
        self.assertEqual(frame.type, 0)
        self.assertEqual(frame.desc, u"")
        self.assertEqual(frame.text, u"")

    def test_hash(self):
        frame = SYLT(encoding=0, lang="foo", format=1, type=2,
                     desc="d", text=[("t", 0)])
        self.assertEqual(frame.HashKey, "SYLT:d:foo")
        frame._pprint()

    def test_bad_sylt(self):
        self.assertRaises(
            ID3JunkFrameError, SYLT._fromData, _24, 0x0,
            b"\x00eng\x01description\x00foobar")
        self.assertRaises(
            ID3JunkFrameError, SYLT._fromData, _24, 0x0,
            b"\x00eng\x01description\x00foobar\x00\xFF\xFF\xFF")


class TRVRB(TestCase):

    def test_default(self):
        frame = RVRB()
        self.assertEqual(frame.left, 0)
        self.assertEqual(frame.right, 0)
        self.assertEqual(frame.bounce_left, 0)
        self.assertEqual(frame.bounce_right, 0)
        self.assertEqual(frame.feedback_ltl, 0)
        self.assertEqual(frame.feedback_ltr, 0)
        self.assertEqual(frame.feedback_rtr, 0)
        self.assertEqual(frame.feedback_rtl, 0)
        self.assertEqual(frame.premix_ltr, 0)
        self.assertEqual(frame.premix_rtl, 0)

    def test_extradata(self):
        self.assertEqual(RVRB()._readData(_24, b'L1R1BBFFFFPP#xyz'), b'#xyz')


class TRBUF(TestCase):

    def test_default(self):
        frame = RBUF()
        self.assertEqual(frame.size, 0)
        self.assertFalse(hasattr(frame, "info"))
        self.assertFalse(hasattr(frame, "offset"))

    def test_extradata(self):
        self.assertEqual(
            RBUF()._readData(
                _24, b'\x00\x01\x00\x01\x00\x00\x00\x00#xyz'), b'#xyz')


class TUSLT(TestCase):

    def test_default(self):
        frame = USLT()
        self.assertEqual(frame.encoding, 1)
        self.assertEqual(frame.lang, u"XXX")
        self.assertEqual(frame.desc, u"")
        self.assertEqual(frame.text, u"")

    def test_hash(self):
        frame = USLT(encoding=0, lang="foo", desc="d", text="t")
        self.assertEqual(frame.HashKey, "USLT:d:foo")
        frame._pprint()


class TWXXX(TestCase):

    def test_default(self):
        frame = WXXX()
        self.assertEqual(frame.encoding, 1)
        self.assertEqual(frame.desc, u"")
        self.assertEqual(frame.url, u"")

    def test_hash(self):
        self.assert_(isinstance(WXXX(url='durl'), WXXX))

        frame = WXXX(encoding=0, desc="d", url="u")
        self.assertEqual(frame.HashKey, "WXXX:d")
        frame._pprint()

        self.assertEquals(WXXX(text="a").HashKey, WXXX(text="b").HashKey)
        self.assertNotEquals(WXXX(desc="a").HashKey, WXXX(desc="b").HashKey)


class TTXXX(TestCase):

    def test_default(self):
        self.assertEqual(TXXX(), TXXX(desc=u"", encoding=1, text=[]))

    def test_hash(self):
        frame = TXXX(encoding=0, desc="d", text=[])
        self.assertEqual(frame.HashKey, "TXXX:d")
        frame._pprint()

        self.assertEquals(TXXX(text="a").HashKey, TXXX(text="b").HashKey)
        self.assertNotEquals(TXXX(desc="a").HashKey, TXXX(desc="b").HashKey)


class TWCOM(TestCase):

    def test_hash(self):
        frame = WCOM(url="u")
        self.assertEqual(frame.HashKey, "WCOM:u")
        frame._pprint()


class TUrlFrame(TestCase):

    def test_default(self):
        self.assertEqual(UrlFrame(), UrlFrame(url=u""))

    def test_main(self):
        self.assertEqual(UrlFrame("url").url, "url")


class TNumericTextFrame(TestCase):

    def test_default(self):
        self.assertEqual(
            NumericTextFrame(), NumericTextFrame(encoding=1, text=[]))

    def test_main(self):
        self.assertEqual(NumericTextFrame(text='1').text, ["1"])
        self.assertEqual(+NumericTextFrame(text='1'), 1)


class TNumericPartTextFrame(TestCase):

    def test_default(self):
        self.assertEqual(
            NumericPartTextFrame(),
            NumericPartTextFrame(encoding=1, text=[]))

    def test_main(self):
        self.assertEqual(NumericPartTextFrame(text='1/2').text, ["1/2"])
        self.assertEqual(+NumericPartTextFrame(text='1/2'), 1)


class Tread_frames_load_frame(TestCase):

    def test_detect_23_ints_in_24_frames(self):
        head = b'TIT1\x00\x00\x01\x00\x00\x00\x00'
        tail = b'TPE1\x00\x00\x00\x05\x00\x00\x00Yay!'

        tagsgood = read_frames(_24, head + b'a' * 127 + tail, Frames)[0]
        tagsbad = read_frames(_24, head + b'a' * 255 + tail, Frames)[0]
        self.assertEquals(2, len(tagsgood))
        self.assertEquals(2, len(tagsbad))
        self.assertEquals('a' * 127, tagsgood[0])
        self.assertEquals('a' * 255, tagsbad[0])
        self.assertEquals('Yay!', tagsgood[1])
        self.assertEquals('Yay!', tagsbad[1])

        tagsgood = read_frames(_24, head + b'a' * 127, Frames)[0]
        tagsbad = read_frames(_24, head + b'a' * 255, Frames)[0]
        self.assertEquals(1, len(tagsgood))
        self.assertEquals(1, len(tagsbad))
        self.assertEquals('a' * 127, tagsgood[0])
        self.assertEquals('a' * 255, tagsbad[0])

    def test_zerolength_framedata(self):
        tail = b'\x00' * 6
        for head in b'WOAR TENC TCOP TOPE WXXX'.split():
            data = head + tail
            self.assertEquals(
                0, len(list(read_frames(_24, data, Frames)[1])))

    def test_drops_truncated_frames(self):
        tail = b'\x00\x00\x00\x03\x00\x00' b'\x01\x02\x03'
        for head in b'RVA2 TXXX APIC'.split():
            data = head + tail
            self.assertEquals(
                0, len(read_frames(_24, data, Frames)[1]))

    def test_drops_nonalphanum_frames(self):
        tail = b'\x00\x00\x00\x03\x00\x00' b'\x01\x02\x03'
        for head in [b'\x06\xaf\xfe\x20', b'ABC\x00', b'A   ']:
            data = head + tail
            self.assertEquals(
                0, len(read_frames(_24, data, Frames)[0]))

    def test_frame_too_small(self):
        self.assertEquals([], read_frames(_24, b'012345678', Frames)[0])
        self.assertEquals([], read_frames(_23, b'012345678', Frames)[0])
        self.assertEquals([], read_frames(_22, b'01234', Frames_2_2)[0])
        self.assertEquals(
            [], read_frames(_22, b'TT1' + b'\x00' * 3, Frames_2_2)[0])

    def test_unknown_22_frame(self):
        data = b'XYZ\x00\x00\x01\x00'
        self.assertEquals([data], read_frames(_22, data, {})[1])

    def test_22_uses_direct_ints(self):
        data = b'TT1\x00\x00\x83\x00' + (b'123456789abcdef' * 16)
        tag = read_frames(_22, data, Frames_2_2)[0][0]
        self.assertEquals(data[7:7 + 0x82].decode('latin1'), tag.text[0])

    def test_load_write(self):
        artists = [s.decode('utf8') for s in
                   [b'\xc2\xb5', b'\xe6\x97\xa5\xe6\x9c\xac']]
        artist = TPE1(encoding=3, text=artists)
        config = ID3SaveConfig()
        tag = read_frames(_24, save_frame(artist, config=config), Frames)[0][0]
        self.assertEquals('TPE1', type(tag).__name__)
        self.assertEquals(artist.text, tag.text)


class TTPE2(TestCase):

    def test_unsynch(self):
        header = ID3Header()
        header.version = (2, 4, 0)
        header._flags = 0x80
        badsync = b'\x00\xff\x00ab\x00'

        self.assertEquals(TPE2._fromData(header, 0, badsync), [u"\xffab"])

        header._flags = 0x00
        self.assertEquals(TPE2._fromData(header, 0x02, badsync), [u"\xffab"])

        tag = TPE2._fromData(header, 0, badsync)
        self.assertEquals(tag, [u"\xff", u"ab"])


class TTPE1(TestCase):

    def test_badencoding(self):
        self.assertRaises(
            ID3JunkFrameError, TPE1._fromData, _24, 0, b"\x09ab")
        self.assertRaises(ValueError, TPE1, encoding=9, text="ab")

    def test_badsync(self):
        frame = TPE1._fromData(_24, 0x02, b"\x00\xff\xfe")
        self.assertEqual(frame.text, [u'\xff\xfe'])

    def test_noencrypt(self):
        self.assertRaises(
            NotImplementedError, TPE1._fromData, _24, 0x04, b"\x00")
        self.assertRaises(
            NotImplementedError, TPE1._fromData, _23, 0x40, b"\x00")

    def test_badcompress(self):
        self.assertRaises(
            ID3JunkFrameError, TPE1._fromData, _24, 0x08,
            b"\x00\x00\x00\x00#")
        self.assertRaises(
            ID3JunkFrameError, TPE1._fromData, _23, 0x80,
            b"\x00\x00\x00\x00#")

    def test_junkframe(self):
        self.assertRaises(
            ID3JunkFrameError, TPE1._fromData, _24, 0, b"")
        self.assertRaises(
            ID3JunkFrameError, TPE1._fromData, _24, 0, b'\x03A\xff\xfe')

    def test_lengthone_utf16(self):
        tpe1 = TPE1._fromData(_24, 0, b'\x01\x00')
        self.assertEquals(u'', tpe1)
        tpe1 = TPE1._fromData(_24, 0, b'\x01\x00\x00\x00\x00')
        self.assertEquals([u'', u''], tpe1)

    def test_utf16_wrongnullterm(self):
        # issue 169
        tpe1 = TPE1._fromData(
            _24, 0, b'\x01\xff\xfeH\x00e\x00l\x00l\x00o\x00\x00')
        self.assertEquals(tpe1, [u'Hello'])

        tpe1 = TPE1._fromData(
            _24, 0, b'\x02\x00H\x00e\x00l\x00l\x00o\x00')
        self.assertEquals(tpe1, [u'Hello'])

    def test_utf_16_missing_bom(self):
        tpe1 = TPE1._fromData(
            _24, 0, b'\x01H\x00e\x00l\x00l\x00o\x00\x00\x00')
        self.assertEquals(tpe1, [u'Hello'])

    def test_utf_16_missing_bom_wrong_nullterm(self):
        tpe1 = TPE1._fromData(
            _24, 0, b'\x01H\x00e\x00l\x00l\x00o\x00\x00')
        self.assertEquals(tpe1, [u'Hello'])

        tpe1 = TPE1._fromData(
            _24, 0, b'\x01f\x00o\x00o\x00\x00\x00b\x00a\x00r\x00\x00')
        self.assertEquals(tpe1, [u"foo", u"bar"])

    def test_zlib_bpi(self):
        tpe1 = TPE1(encoding=0, text="a" * (0xFFFF - 2))
        data = save_frame(tpe1)
        datalen_size = data[4 + 4 + 2:4 + 4 + 2 + 4]
        self.failIf(
            max(datalen_size) >= b'\x80'[0], "data is not syncsafe: %r" % data)

    def test_ql_0_12_missing_uncompressed_size(self):
        tag = TPE1._fromData(
            _24, 0x08,
            b'x\x9cc\xfc\xff\xaf\x84!\x83!\x93'
            b'\xa1\x98A\x01J&2\xe83\x940\xa4\x02\xd9%\x0c\x00\x87\xc6\x07#'
        )
        self.assertEquals(tag.encoding, 1)
        self.assertEquals(tag, ['this is a/test'])

    def test_zlib_latin1_missing_datalen(self):
        tag = TPE1._fromData(
            _24, 0x8,
            b'\x00\x00\x00\x0f'
            b'x\x9cc(\xc9\xc8,V\x00\xa2D\xfd\x92\xd4\xe2\x12\x00&\x7f\x05%'
        )
        self.assertEquals(tag.encoding, 0)
        self.assertEquals(tag, ['this is a/test'])


class TTCON(TestCase):

    def _g(self, s):
        return TCON(text=s).genres

    def test_empty(self):
        self.assertEquals(self._g(""), [])

    def test_num(self):
        for i in xrange(len(GENRES)):
            self.assertEquals(self._g("%02d" % i), [GENRES[i]])

    def test_parened_num(self):
        for i in xrange(len(GENRES)):
            self.assertEquals(self._g("(%02d)" % i), [GENRES[i]])

    def test_unknown(self):
        self.assertEquals(self._g("(255)"), ["Unknown"])
        self.assertEquals(self._g("199"), ["Unknown"])
        self.assertNotEqual(self._g("256"), ["Unknown"])

    def test_parened_multi(self):
        self.assertEquals(self._g("(00)(02)"), ["Blues", "Country"])

    def test_coverremix(self):
        self.assertEquals(self._g("CR"), ["Cover"])
        self.assertEquals(self._g("(CR)"), ["Cover"])
        self.assertEquals(self._g("RX"), ["Remix"])
        self.assertEquals(self._g("(RX)"), ["Remix"])

    def test_parened_text(self):
        self.assertEquals(
            self._g("(00)(02)Real Folk Blues"),
            ["Blues", "Country", "Real Folk Blues"])

    def test_escape(self):
        self.assertEquals(self._g("(0)((A genre)"), ["Blues", "(A genre)"])
        self.assertEquals(self._g("(10)((20)"), ["New Age", "(20)"])

    def test_nullsep(self):
        self.assertEquals(self._g("0\x00A genre"), ["Blues", "A genre"])

    def test_nullsep_empty(self):
        self.assertEquals(self._g("\x000\x00A genre"), ["Blues", "A genre"])

    def test_crazy(self):
        self.assertEquals(
            self._g("(20)(CR)\x0030\x00\x00Another\x00(51)Hooray"),
            ['Alternative', 'Cover', 'Fusion', 'Another',
             'Techno-Industrial', 'Hooray'])

    def test_repeat(self):
        self.assertEquals(self._g("(20)Alternative"), ["Alternative"])
        self.assertEquals(
            self._g("(20)\x00Alternative"), ["Alternative", "Alternative"])

    def test_set_genre(self):
        gen = TCON(encoding=0, text="")
        self.assertEquals(gen.genres, [])
        gen.genres = ["a genre", "another"]
        self.assertEquals(gen.genres, ["a genre", "another"])

    def test_set_string(self):
        gen = TCON(encoding=0, text="")
        gen.genres = "foo"
        self.assertEquals(gen.genres, ["foo"])

    def test_nodoubledecode(self):
        gen = TCON(encoding=1, text=u"(255)genre")
        gen.genres = gen.genres
        self.assertEquals(gen.genres, [u"Unknown", u"genre"])


class TID3TimeStamp(TestCase):

    def test_Y(self):
        s = ID3TimeStamp('1234')
        self.assertEquals(s.year, 1234)
        self.assertEquals(s.text, '1234')

    def test_yM(self):
        s = ID3TimeStamp('1234-56')
        self.assertEquals(s.year, 1234)
        self.assertEquals(s.month, 56)
        self.assertEquals(s.text, '1234-56')

    def test_ymD(self):
        s = ID3TimeStamp('1234-56-78')
        self.assertEquals(s.year, 1234)
        self.assertEquals(s.month, 56)
        self.assertEquals(s.day, 78)
        self.assertEquals(s.text, '1234-56-78')

    def test_ymdH(self):
        s = ID3TimeStamp('1234-56-78T12')
        self.assertEquals(s.year, 1234)
        self.assertEquals(s.month, 56)
        self.assertEquals(s.day, 78)
        self.assertEquals(s.hour, 12)
        self.assertEquals(s.text, '1234-56-78 12')

    def test_ymdhM(self):
        s = ID3TimeStamp('1234-56-78T12:34')
        self.assertEquals(s.year, 1234)
        self.assertEquals(s.month, 56)
        self.assertEquals(s.day, 78)
        self.assertEquals(s.hour, 12)
        self.assertEquals(s.minute, 34)
        self.assertEquals(s.text, '1234-56-78 12:34')

    def test_ymdhmS(self):
        s = ID3TimeStamp('1234-56-78T12:34:56')
        self.assertEquals(s.year, 1234)
        self.assertEquals(s.month, 56)
        self.assertEquals(s.day, 78)
        self.assertEquals(s.hour, 12)
        self.assertEquals(s.minute, 34)
        self.assertEquals(s.second, 56)
        self.assertEquals(s.text, '1234-56-78 12:34:56')

    def test_Ymdhms(self):
        s = ID3TimeStamp('1234-56-78T12:34:56')
        s.month = None
        self.assertEquals(s.text, '1234')

    def test_alternate_reprs(self):
        s = ID3TimeStamp('1234-56.78 12:34:56')
        self.assertEquals(s.text, '1234-56-78 12:34:56')

    def test_order(self):
        s = ID3TimeStamp('1234')
        t = ID3TimeStamp('1233-12')
        u = ID3TimeStamp('1234-01')

        self.assert_(t < s < u)
        self.assert_(u > s > t)

    def test_types(self):
        if PY3:
            self.assertRaises(TypeError, ID3TimeStamp, b"blah")
        self.assertEquals(
            text_type(ID3TimeStamp(u"2000-01-01")), u"2000-01-01")
        self.assertEquals(
            bytes(ID3TimeStamp(u"2000-01-01")), b"2000-01-01")


class TFrameTest(object):

    FRAME = None

    def test_has_doc(self):
        self.failUnless(self.FRAME.__doc__, "%s has no docstring" % self.FRAME)

    def test_fake_zlib(self):
        header = ID3Header()
        header.version = (2, 4, 0)
        self.assertRaises(ID3JunkFrameError, self.FRAME._fromData, header,
                          Frame.FLAG24_COMPRESS, b'\x03abcdefg')

    def test_no_hash(self):
        self.failUnlessRaises(
            TypeError, {}.__setitem__, self.FRAME(), None)

    def test_is_valid_frame_id(self):
        self.assertTrue(is_valid_frame_id(self.FRAME.__name__))

    def test_all_specs_have_default(self):
        for spec in self.FRAME._framespec:
            self.assertTrue(
                spec.default is not None,
                msg="%r:%r" % (self.FRAME, spec.name))

    @classmethod
    def create_frame_tests(cls):
        for kind in (list(Frames.values()) + list(Frames_2_2.values())):
            new_type = type(cls.__name__ + kind.__name__,
                            (cls, TestCase), {"FRAME": kind})
            assert new_type.__name__ not in globals()
            globals()[new_type.__name__] = new_type


TFrameTest.create_frame_tests()


class FrameIDValidate(TestCase):

    def test_valid(self):
        self.failUnless(is_valid_frame_id("APIC"))
        self.failUnless(is_valid_frame_id("TPE2"))

    def test_invalid(self):
        self.failIf(is_valid_frame_id("MP3e"))
        self.failIf(is_valid_frame_id("+ABC"))


class TTimeStampTextFrame(TestCase):

    def test_default(self):
        self.assertEqual(
            TimeStampTextFrame(), TimeStampTextFrame(encoding=1, text=[]))

    def test_compare_to_unicode(self):
        frame = TimeStampTextFrame(encoding=0, text=[u'1987', u'1988'])
        self.failUnlessEqual(frame, text_type(frame))


class TTextFrame(TestCase):

    def test_defaults(self):
        self.assertEqual(TextFrame(), TextFrame(encoding=1, text=[]))

    def test_default_default_mutable(self):
        frame = TextFrame()
        frame.text.append("foo")
        self.assertEqual(TextFrame().text, [])

    def test_main(self):
        self.assertEqual(TextFrame(text='text').text, ["text"])
        self.assertEqual(TextFrame(text=['a', 'b']).text, ["a", "b"])

    def test_multi_value(self):
        frame = TextFrame(
            text=[u"foo", u"", u"", u"bar", u"", u""], encoding=0)
        config = ID3SaveConfig(3, None)
        data = frame._writeData(config)

        frame = frame._fromData(_24, 0x0, data)
        self.assertEqual(frame.text, [u"foo", u"", u"", u"bar", u"", u""])
        frame = frame._fromData(_23, 0x0, data)
        self.assertEqual(frame.text, [u"foo", u"", u"", u"bar"])
        frame = frame._fromData(_22, 0x0, data)
        self.assertEqual(frame.text, [u"foo", u"", u"", u"bar"])

    def test_list_iface(self):
        frame = TextFrame()
        frame.append("a")
        frame.extend(["b", "c"])
        self.assertEqual(frame.text, ["a", "b", "c"])

    def test_zlib_latin1(self):
        tag = TextFrame._fromData(
            _24, 0x9, b'\x00\x00\x00\x0f'
            b'x\x9cc(\xc9\xc8,V\x00\xa2D\xfd\x92\xd4\xe2\x12\x00&\x7f\x05%'
        )
        self.assertEquals(tag.encoding, 0)
        self.assertEquals(tag, ['this is a/test'])

    def test_datalen_but_not_compressed(self):
        tag = TextFrame._fromData(_24, 0x01, b'\x00\x00\x00\x06\x00A test')
        self.assertEquals(tag.encoding, 0)
        self.assertEquals(tag, ['A test'])

    def test_utf8(self):
        tag = TextFrame._fromData(_23, 0x00, b'\x03this is a test')
        self.assertEquals(tag.encoding, 3)
        self.assertEquals(tag, 'this is a test')

    def test_zlib_utf16(self):
        data = (b'\x00\x00\x00\x1fx\x9cc\xfc\xff\xaf\x84!\x83!\x93\xa1\x98A'
                b'\x01J&2\xe83\x940\xa4\x02\xd9%\x0c\x00\x87\xc6\x07#')
        tag = TextFrame._fromData(_23, 0x80, data)
        self.assertEquals(tag.encoding, 1)
        self.assertEquals(tag, ['this is a/test'])

        tag = TextFrame._fromData(_24, 0x08, data)
        self.assertEquals(tag.encoding, 1)
        self.assertEquals(tag, ['this is a/test'])


class TRVA2(TestCase):

    def test_default(self):
        frame = RVA2()
        self.assertEqual(frame.desc, u"")
        self.assertEqual(frame.channel, 1)
        self.assertEqual(frame.gain, 1)
        self.assertEqual(frame.peak, 1)

    def test_basic(self):
        r = RVA2(gain=1, channel=1, peak=1)
        self.assertEqual(r, r)
        self.assertNotEqual(r, 42)

    def test_hash_key(self):
        frame = RVA2(method=42, desc="d", channel=1, gain=1, peak=1)
        self.assertEqual(frame.HashKey, "RVA2:d")

        self.assertEquals(RVA2(gain=1).HashKey, RVA2(gain=2).HashKey)
        self.assertNotEquals(RVA2(desc="a").HashKey, RVA2(desc="b").HashKey)

    def test_pprint(self):
        frame = RVA2(method=42, desc="d", channel=1, gain=1, peak=1)
        frame._pprint()

    def test_wacky_truncated(self):
        data = b'\x01{\xf0\x10\xff\xff\x00'
        self.assertRaises(ID3JunkFrameError, RVA2._fromData, _24, 0x00, data)

    def test_bad_number_of_bits(self):
        data = b'\x00\x00\x01\xe6\xfc\x10{\xd7'
        self.assertRaises(ID3JunkFrameError, RVA2._fromData, _24, 0x00, data)


class TCTOC(TestCase):

    def test_defaults(self):
        self.assertEqual(CTOC(), CTOC(element_id=u"", flags=0,
                                      child_element_ids=[], sub_frames=[]))

    def test_hash(self):
        frame = CTOC(element_id=u"foo", flags=3,
                     child_element_ids=[u"ch0"],
                     sub_frames=[TPE2(encoding=3, text=[u"foo"])])
        self.assertEqual(frame.HashKey, "CTOC:foo")

    def test_pprint(self):
        frame = CTOC(element_id=u"foo", flags=3,
                     child_element_ids=[u"ch0"],
                     sub_frames=[TPE2(encoding=3, text=[u"foo"])])
        self.assertEqual(
            frame.pprint(),
            "CTOC=foo flags=3 child_element_ids=ch0\n    TPE2=foo")

    def test_write(self):
        frame = CTOC(element_id=u"foo", flags=3,
                     child_element_ids=[u"ch0"],
                     sub_frames=[TPE2(encoding=3, text=[u"f", u"b"])])
        config = ID3SaveConfig(3, "/")
        data = (b"foo\x00\x03\x01ch0\x00TPE2\x00\x00\x00\x0b\x00\x00\x01"
                b"\xff\xfef\x00/\x00b\x00\x00\x00")
        self.assertEqual(frame._writeData(config), data)

    def test_eq(self):
        self.assertEqual(CTOC(), CTOC())
        self.assertNotEqual(CTOC(), object())


class TASPI(TestCase):

    def test_default(self):
        frame = ASPI()
        self.assertEqual(frame.S, 0)
        self.assertEqual(frame.L, 0)
        self.assertEqual(frame.N, 0)
        self.assertEqual(frame.b, 0)
        self.assertEqual(frame.Fi, [])

    def test_default_default_mutable(self):
        frame = ASPI()
        frame.Fi.append(1)
        self.assertEqual(ASPI().Fi, [])


class TCHAP(TestCase):

    def test_default(self):
        frame = CHAP()
        self.assertEqual(frame.element_id, u"")
        self.assertEqual(frame.start_time, 0)
        self.assertEqual(frame.end_time, 0)
        self.assertEqual(frame.start_offset, 0xffffffff)
        self.assertEqual(frame.end_offset, 0xffffffff)
        self.assertEqual(frame.sub_frames, ID3Tags())

    def test_hash(self):
        frame = CHAP(element_id=u"foo", start_time=0, end_time=0,
                     start_offset=0, end_offset=0,
                     sub_frames=[TPE2(encoding=3, text=[u"foo"])])
        self.assertEqual(frame.HashKey, "CHAP:foo")

    def test_pprint(self):
        frame = CHAP(element_id=u"foo", start_time=0, end_time=0,
                     start_offset=0, end_offset=0,
                     sub_frames=[TPE2(encoding=3, text=[u"foo"])])
        self.assertEqual(
            frame.pprint(), "CHAP=foo time=0..0 offset=0..0\n    TPE2=foo")

    def test_eq(self):
        self.assertEqual(CHAP(), CHAP())
        self.assertNotEqual(CHAP(), object())


class TPCNT(TestCase):

    def test_default(self):
        frame = PCNT()
        self.assertEqual(frame.count, 0)


class TAPIC(TestCase):

    def test_default(self):
        frame = APIC()
        self.assertEqual(frame.encoding, 1)
        self.assertEqual(frame.mime, u"")
        self.assertEqual(frame.type, 3)
        self.assertEqual(frame.desc, u"")
        self.assertEqual(frame.data, b"")

    def test_hash(self):
        frame = APIC(encoding=0, mime=u"m", type=3, desc=u"d", data=b"\x42")
        self.assertEqual(frame.HashKey, "APIC:d")

    def test_pprint(self):
        frame = APIC(
            encoding=0, mime=u"mime", type=3, desc=u"desc", data=b"\x42")
        self.assertEqual(frame._pprint(), u"cover front, desc (mime, 1 bytes)")

    def test_multi(self):
        self.assertEquals(APIC(data=b"1").HashKey, APIC(data=b"2").HashKey)
        self.assertNotEquals(APIC(desc="a").HashKey, APIC(desc="b").HashKey)

    def test_repr(self):
        frame = APIC(encoding=0, mime=u"m", type=3, desc=u"d", data=b"\x42")
        if PY2:
            expected = (
                "APIC(encoding=<Encoding.LATIN1: 0>, mime=u'm', "
                "type=<PictureType.COVER_FRONT: 3>, desc=u'd', data='B')")
        else:
            expected = (
                "APIC(encoding=<Encoding.LATIN1: 0>, mime='m', "
                "type=<PictureType.COVER_FRONT: 3>, desc='d', data=b'B')")

        self.assertEqual(repr(frame), expected)
        new_frame = APIC()
        new_frame._readData(_24, frame._writeData())
        self.assertEqual(repr(new_frame), expected)
