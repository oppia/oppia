# -*- coding: utf-8 -*-

import os
import warnings

from mutagen._compat import PY3, text_type, PY2, izip, cBytesIO
from mutagen.asf import ASF, ASFHeaderError, ASFValue, UNICODE, DWORD, QWORD
from mutagen.asf import BOOL, WORD, BYTEARRAY, GUID
from mutagen.asf._util import guid2bytes, bytes2guid
from mutagen.asf._objects import ContentDescriptionObject, \
    ExtendedContentDescriptionObject, HeaderExtensionObject, \
    MetadataObject, MetadataLibraryObject, CodecListObject, PaddingObject, \
    HeaderObject
from mutagen.asf import ASFUnicodeAttribute, ASFError, ASFByteArrayAttribute, \
    ASFBoolAttribute, ASFDWordAttribute, ASFQWordAttribute, ASFWordAttribute, \
    ASFGUIDAttribute

from tests import TestCase, DATA_DIR, get_temp_copy


class TASFFile(TestCase):

    def test_not_my_file(self):
        self.failUnlessRaises(
            ASFHeaderError, ASF,
            os.path.join(DATA_DIR, "empty.ogg"))
        self.failUnlessRaises(
            ASFHeaderError, ASF,
            os.path.join(DATA_DIR, "click.mpc"))


class TASFMisc(TestCase):

    def test_guid(self):
        ex = "75B22633-668E-11CF-A6D9-00AA0062CE6C"
        b = guid2bytes(ex)
        self.assertEqual(len(b), 16)
        self.assertTrue(isinstance(b, bytes))
        self.assertEqual(bytes2guid(b), ex)


class TASFInfo(TestCase):

    def setUp(self):
        # WMA 9.1 64kbps CBR 48khz
        self.wma1 = ASF(os.path.join(DATA_DIR, "silence-1.wma"))
        # WMA 9.1 Professional 192kbps VBR 44khz
        self.wma2 = ASF(os.path.join(DATA_DIR, "silence-2.wma"))
        # WMA 9.1 Lossless 44khz
        self.wma3 = ASF(os.path.join(DATA_DIR, "silence-3.wma"))

    def test_length(self):
        self.failUnlessAlmostEqual(self.wma1.info.length, 3.7, 1)
        self.failUnlessAlmostEqual(self.wma2.info.length, 3.7, 1)
        self.failUnlessAlmostEqual(self.wma3.info.length, 3.7, 1)

    def test_bitrate(self):
        self.failUnlessEqual(self.wma1.info.bitrate // 1000, 64)
        self.failUnlessEqual(self.wma2.info.bitrate // 1000, 38)
        self.failUnlessEqual(self.wma3.info.bitrate // 1000, 58)

    def test_sample_rate(self):
        self.failUnlessEqual(self.wma1.info.sample_rate, 48000)
        self.failUnlessEqual(self.wma2.info.sample_rate, 44100)
        self.failUnlessEqual(self.wma3.info.sample_rate, 44100)

    def test_channels(self):
        self.failUnlessEqual(self.wma1.info.channels, 2)
        self.failUnlessEqual(self.wma2.info.channels, 2)
        self.failUnlessEqual(self.wma3.info.channels, 2)

    def test_codec_type(self):
        self.assertEqual(self.wma1.info.codec_type,
                         "Windows Media Audio 9 Standard")
        self.assertEqual(self.wma2.info.codec_type,
                         "Windows Media Audio 9 Professional")
        self.assertEqual(self.wma3.info.codec_type,
                         "Windows Media Audio 9 Lossless")

    def test_codec_name(self):
        self.assertEqual(self.wma1.info.codec_name,
            "Windows Media Audio 9.1")
        self.assertEqual(self.wma2.info.codec_name,
            "Windows Media Audio 9.1 Professional")
        self.assertEqual(self.wma3.info.codec_name,
            "Windows Media Audio 9.1 Lossless")

    def test_codec_description(self):
        self.assertEqual(self.wma1.info.codec_description,
            "64 kbps, 48 kHz, stereo 2-pass CBR")
        self.assertEqual(self.wma2.info.codec_description,
            "192 kbps, 44 kHz, 2 channel 24 bit 2-pass VBR")
        self.assertEqual(self.wma3.info.codec_description,
            "VBR Quality 100, 44 kHz, 2 channel 16 bit 1-pass VBR")

    def test_pprint(self):
        self.assertTrue(self.wma1.info.pprint())
        self.assertTrue(isinstance(self.wma1.info.pprint(), text_type))


class TASF(TestCase):

    def setUp(self):
        self.filename = get_temp_copy(self.original)
        self.audio = ASF(self.filename)

    def tearDown(self):
        os.unlink(self.filename)


class TASFMixin(object):

    def test_header_object_misc(self):
        header = self.audio._header
        header.pprint()
        repr(header)

    def test_delete(self):
        self.audio["QL/Bla"] = u"Foooooooooooooooooo"
        self.audio.save(padding=lambda x: 0)
        filesize = os.path.getsize(self.audio.filename)
        self.audio.delete()
        self.assertTrue(os.path.getsize(self.audio.filename) < filesize)

    def test_pprint(self):
        self.failUnless(self.audio.pprint())

    def set_key(self, key, value, result=None, expected=True):
        self.audio[key] = value
        self.audio.save()
        self.audio = ASF(self.audio.filename)
        self.failUnless(key in self.audio)
        self.failUnless(key in self.audio.tags)
        self.failUnless(key in self.audio.tags.keys())
        self.failUnless(key in self.audio.tags.as_dict().keys())
        newvalue = self.audio[key]
        if isinstance(newvalue, list):
            for a, b in izip(sorted(newvalue), sorted(result or value)):
                self.failUnlessEqual(a, b)
        else:
            self.failUnlessEqual(self.audio[key], result or value)

    def test_slice(self):
        tags = self.audio.tags
        tags.clear()
        tags["Author"] = [u"Foo", u"Bar"]
        self.assertEqual(tags[:], [("Author", "Foo"), ("Author", "Bar")])
        del tags[:]
        self.assertEqual(tags[:], [])
        tags[:] = [("Author", "Baz")]
        self.assertEqual(tags.items(), [("Author", ["Baz"])])

    def test_iter(self):
        self.assertEqual(next(iter(self.audio.tags)), ("Title", "test"))
        self.assertEqual(list(self.audio.tags)[0], ("Title", "test"))

    def test_contains(self):
        self.failUnlessEqual("notatag" in self.audio.tags, False)

    def test_inval_type(self):
        self.failUnlessRaises(ValueError, ASFValue, "", 4242)

    def test_repr(self):
        repr(ASFValue(u"foo", UNICODE, stream=1, language=2))

    def test_auto_guuid(self):
        value = ASFValue(b'\x9eZl}\x89\xa2\xb5D\xb8\xa30\xfe', GUID)
        self.set_key(u"WM/WMCollectionGroupID", value, [value])

    def test_py3_bytes(self):
        if PY3:
            value = ASFValue(b'\xff\x00', BYTEARRAY)
            self.set_key(u"QL/Something", [b'\xff\x00'], [value])

    def test_set_invalid(self):
        setitem = self.audio.__setitem__
        if PY2:
            self.assertRaises(ValueError, setitem, u"QL/Something", [b"\xff"])
        self.assertRaises(TypeError, setitem, u"QL/Something", [object()])

        # don't delete on error
        setitem(u"QL/Foobar", [u"ok"])
        self.assertRaises(TypeError, setitem, u"QL/Foobar", [object()])
        self.assertEqual(self.audio[u"QL/Foobar"], [u"ok"])

    def test_auto_unicode(self):
        self.set_key(u"WM/AlbumTitle", u"foo",
                     [ASFValue(u"foo", UNICODE)])

    def test_auto_unicode_list(self):
        self.set_key(u"WM/AlbumTitle", [u"foo", u"bar"],
                     [ASFValue(u"foo", UNICODE), ASFValue(u"bar", UNICODE)])

    def test_word(self):
        self.set_key(u"WM/Track", ASFValue(24, WORD), [ASFValue(24, WORD)])

    def test_auto_word(self):
        self.set_key(u"WM/Track", 12,
                     [ASFValue(12, DWORD)])

    def test_auto_word_list(self):
        self.set_key(u"WM/Track", [12, 13],
                     [ASFValue(12, WORD), ASFValue(13, WORD)])

    def test_auto_dword(self):
        self.set_key(u"WM/Track", 12,
                     [ASFValue(12, DWORD)])

    def test_auto_dword_list(self):
        self.set_key(u"WM/Track", [12, 13],
                     [ASFValue(12, DWORD), ASFValue(13, DWORD)])

    def test_auto_qword(self):
        self.set_key(u"WM/Track", 12,
                     [ASFValue(12, QWORD)])

    def test_auto_qword_list(self):
        self.set_key(u"WM/Track", [12, 13],
                     [ASFValue(12, QWORD), ASFValue(13, QWORD)])

    def test_auto_bool(self):
        self.set_key(u"IsVBR", True,
                     [ASFValue(True, BOOL)])

    def test_auto_bool_list(self):
        self.set_key(u"IsVBR", [True, False],
                     [ASFValue(True, BOOL), ASFValue(False, BOOL)])

    def test_basic_tags(self):
        self.set_key("Title", "Wheeee", ["Wheeee"])
        self.set_key("Author", "Whoooo", ["Whoooo"])
        self.set_key("Copyright", "Whaaaa", ["Whaaaa"])
        self.set_key("Description", "Wii", ["Wii"])
        self.set_key("Rating", "5", ["5"])

    def test_stream(self):
        self.audio["QL/OneHasStream"] = [
            ASFValue("Whee", UNICODE, stream=2),
            ASFValue("Whee", UNICODE),
        ]
        self.audio["QL/AllHaveStream"] = [
            ASFValue("Whee", UNICODE, stream=1),
            ASFValue("Whee", UNICODE, stream=2),
        ]
        self.audio["QL/NoStream"] = ASFValue("Whee", UNICODE)
        self.audio.save()
        self.audio = ASF(self.audio.filename)
        self.failUnlessEqual(self.audio["QL/NoStream"][0].stream, None)
        self.failUnlessEqual(self.audio["QL/OneHasStream"][1].stream, 2)
        self.failUnlessEqual(self.audio["QL/OneHasStream"][0].stream, None)
        self.failUnlessEqual(self.audio["QL/AllHaveStream"][0].stream, 1)
        self.failUnlessEqual(self.audio["QL/AllHaveStream"][1].stream, 2)

    def test_language(self):
        self.failIf("QL/OneHasLang" in self.audio)
        self.failIf("QL/AllHaveLang" in self.audio)
        self.audio["QL/OneHasLang"] = [
            ASFValue("Whee", UNICODE, language=2),
            ASFValue("Whee", UNICODE),
        ]
        self.audio["QL/AllHaveLang"] = [
            ASFValue("Whee", UNICODE, language=1),
            ASFValue("Whee", UNICODE, language=2),
        ]
        self.audio["QL/NoLang"] = ASFValue("Whee", UNICODE)
        self.audio.save()
        self.audio = ASF(self.audio.filename)
        self.failUnlessEqual(self.audio["QL/NoLang"][0].language, None)
        self.failUnlessEqual(self.audio["QL/OneHasLang"][1].language, 2)
        self.failUnlessEqual(self.audio["QL/OneHasLang"][0].language, None)
        self.failUnlessEqual(self.audio["QL/AllHaveLang"][0].language, 1)
        self.failUnlessEqual(self.audio["QL/AllHaveLang"][1].language, 2)

    def test_lang_and_stream_mix(self):
        self.audio["QL/Mix"] = [
            ASFValue("Whee", UNICODE, stream=1),
            ASFValue("Whee", UNICODE, language=2),
            ASFValue("Whee", UNICODE, stream=3, language=4),
            ASFValue("Whee", UNICODE),
        ]
        self.audio.save()
        self.audio = ASF(self.audio.filename)
        # order not preserved here because they end up in different objects.
        self.failUnlessEqual(self.audio["QL/Mix"][1].language, None)
        self.failUnlessEqual(self.audio["QL/Mix"][1].stream, 1)
        self.failUnlessEqual(self.audio["QL/Mix"][2].language, 2)
        self.failUnlessEqual(self.audio["QL/Mix"][2].stream, 0)
        self.failUnlessEqual(self.audio["QL/Mix"][3].language, 4)
        self.failUnlessEqual(self.audio["QL/Mix"][3].stream, 3)
        self.failUnlessEqual(self.audio["QL/Mix"][0].language, None)
        self.failUnlessEqual(self.audio["QL/Mix"][0].stream, None)

    def test_data_size(self):
        v = ASFValue("", UNICODE, data=b'4\xd8\x1e\xdd\x00\x00')
        self.failUnlessEqual(v.data_size(), len(v._render()))


class TASFAttributes(TestCase):

    def test_ASFUnicodeAttribute(self):
        if PY3:
            self.assertRaises(TypeError, ASFUnicodeAttribute, b"\xff")
        else:
            self.assertRaises(ValueError, ASFUnicodeAttribute, b"\xff")
            val = u'\xf6\xe4\xfc'
            self.assertEqual(ASFUnicodeAttribute(val.encode("utf-8")), val)

        self.assertRaises(ASFError, ASFUnicodeAttribute, data=b"\x00")
        self.assertEqual(ASFUnicodeAttribute(u"foo").value, u"foo")

    def test_ASFUnicodeAttribute_dunder(self):
        attr = ASFUnicodeAttribute(u"foo")

        self.assertEqual(bytes(attr), b"f\x00o\x00o\x00")
        self.assertEqual(text_type(attr), u"foo")
        if PY3:
            self.assertEqual(repr(attr), "ASFUnicodeAttribute('foo')")
        else:
            self.assertEqual(repr(attr), "ASFUnicodeAttribute(u'foo')")
        self.assertRaises(TypeError, int, attr)

    def test_ASFByteArrayAttribute(self):
        self.assertRaises(TypeError, ASFByteArrayAttribute, u"foo")
        self.assertEqual(ASFByteArrayAttribute(data=b"\xff").value, b"\xff")

    def test_ASFByteArrayAttribute_dunder(self):
        attr = ASFByteArrayAttribute(data=b"\xff")
        self.assertEqual(bytes(attr), b"\xff")
        self.assertEqual(text_type(attr), u"[binary data (1 bytes)]")
        if PY3:
            self.assertEqual(repr(attr), r"ASFByteArrayAttribute(b'\xff')")
        else:
            self.assertEqual(repr(attr), r"ASFByteArrayAttribute('\xff')")
        self.assertRaises(TypeError, int, attr)

    def test_ASFByteArrayAttribute_compat(self):
        ba = ASFByteArrayAttribute()
        ba.value = b"\xff"
        self.assertEqual(ba._render(), b"\xff")

    def test_ASFGUIDAttribute(self):
        self.assertEqual(ASFGUIDAttribute(data=b"\xff").value, b"\xff")
        self.assertRaises(TypeError, ASFGUIDAttribute, u"foo")

    def test_ASFGUIDAttribute_dunder(self):
        attr = ASFGUIDAttribute(data=b"\xff")
        self.assertEqual(bytes(attr), b"\xff")
        if PY3:
            self.assertEqual(text_type(attr), u"b'\\xff'")
            self.assertEqual(repr(attr), "ASFGUIDAttribute(b'\\xff')")
        else:
            self.assertEqual(text_type(attr), u"'\\xff'")
            self.assertEqual(repr(attr), "ASFGUIDAttribute('\\xff')")
        self.assertRaises(TypeError, int, attr)

    def test_ASFBoolAttribute(self):
        self.assertEqual(
            ASFBoolAttribute(data=b"\x01\x00\x00\x00").value, True)
        self.assertEqual(
            ASFBoolAttribute(data=b"\x00\x00\x00\x00").value, False)
        self.assertEqual(ASFBoolAttribute(False).value, False)

    def test_ASFBoolAttribute_dunder(self):
        attr = ASFBoolAttribute(False)
        self.assertEqual(bytes(attr), b"False")
        self.assertEqual(text_type(attr), u"False")
        self.assertEqual(repr(attr), "ASFBoolAttribute(False)")
        self.assertRaises(TypeError, int, attr)

    def test_ASFWordAttribute(self):
        self.assertEqual(
            ASFWordAttribute(data=b"\x00" * 2).value, 0)
        self.assertEqual(
            ASFWordAttribute(data=b"\xff" * 2).value, 2 ** 16 - 1)
        self.assertRaises(ValueError, ASFWordAttribute, -1)
        self.assertRaises(ValueError, ASFWordAttribute, 2 ** 16)

    def test_ASFWordAttribute_dunder(self):
        attr = ASFWordAttribute(data=b"\x00" * 2)
        self.assertEqual(bytes(attr), b"0")
        self.assertEqual(text_type(attr), u"0")
        self.assertEqual(repr(attr), "ASFWordAttribute(0)")
        self.assertEqual(int(attr), 0)

    def test_ASFDWordAttribute(self):
        self.assertEqual(
            ASFDWordAttribute(data=b"\x00" * 4).value, 0)
        self.assertEqual(
            ASFDWordAttribute(data=b"\xff" * 4).value, 2 ** 32 - 1)
        self.assertRaises(ValueError, ASFDWordAttribute, -1)
        self.assertRaises(ValueError, ASFDWordAttribute, 2 ** 32)

    def test_ASFDWordAttribute_dunder(self):
        attr = ASFDWordAttribute(data=b"\x00" * 4)
        self.assertEqual(bytes(attr), b"0")
        self.assertEqual(text_type(attr), u"0")
        self.assertEqual(repr(attr).replace("0L", "0"), "ASFDWordAttribute(0)")
        self.assertEqual(int(attr), 0)

    def test_ASFQWordAttribute(self):
        self.assertEqual(
            ASFQWordAttribute(data=b"\x00" * 8).value, 0)
        self.assertEqual(
            ASFQWordAttribute(data=b"\xff" * 8).value, 2 ** 64 - 1)
        self.assertRaises(ValueError, ASFQWordAttribute, -1)
        self.assertRaises(ValueError, ASFQWordAttribute, 2 ** 64)

    def test_ASFQWordAttribute_dunder(self):
        attr = ASFQWordAttribute(data=b"\x00" * 8)
        self.assertEqual(bytes(attr), b"0")
        self.assertEqual(text_type(attr), u"0")
        self.assertEqual(repr(attr).replace("0L", "0"), "ASFQWordAttribute(0)")
        self.assertEqual(int(attr), 0)


class TASFTags1(TASF, TASFMixin):
    original = os.path.join(DATA_DIR, "silence-1.wma")


class TASFTags2(TASF, TASFMixin):
    original = os.path.join(DATA_DIR, "silence-2.wma")


class TASFTags3(TASF, TASFMixin):
    original = os.path.join(DATA_DIR, "silence-3.wma")


class TASFIssue29(TestCase):
    original = os.path.join(DATA_DIR, "issue_29.wma")

    def setUp(self):
        self.filename = get_temp_copy(self.original)
        self.audio = ASF(self.filename)

    def tearDown(self):
        os.unlink(self.filename)

    def test_pprint(self):
        self.audio.pprint()

    def test_issue_29_description(self):
        self.audio["Description"] = "Hello"
        self.audio.save()
        audio = ASF(self.filename)
        self.failUnless("Description" in audio)
        self.failUnlessEqual(audio["Description"], ["Hello"])
        del(audio["Description"])
        self.failIf("Description" in audio)
        audio.save()
        audio = ASF(self.filename)
        self.failIf("Description" in audio)


class TASFObjects(TestCase):

    filename = os.path.join(DATA_DIR, "silence-1.wma")

    def test_invalid_header(self):
        with warnings.catch_warnings():
            warnings.simplefilter("ignore")
            asf = ASF()
        fileobj = cBytesIO(
            b"0&\xb2u\x8ef\xcf\x11\xa6\xd9\x00\xaa\x00b\xcel\x19\xbf\x01\x00"
            b"\x00\x00\x00\x00\x07\x00\x00\x00\x01\x02")
        self.assertRaises(
            ASFHeaderError, HeaderObject.parse_full, asf, fileobj)


class TASFAttrDest(TestCase):

    original = os.path.join(DATA_DIR, "silence-1.wma")

    def setUp(self):
        self.filename = get_temp_copy(self.original)
        audio = ASF(self.filename)
        audio.clear()
        audio.save()

    def tearDown(self):
        os.unlink(self.filename)

    def test_author(self):
        audio = ASF(self.filename)
        values = [u"Foo", u"Bar", u"Baz"]
        audio["Author"] = values
        audio.save()
        self.assertEqual(
            list(audio.to_content_description.items()), [(u"Author", u"Foo")])
        self.assertEqual(
            audio.to_metadata_library,
            [(u"Author", u"Bar"), (u"Author", u"Baz")])

        new = ASF(self.filename)
        self.assertEqual(new["Author"], values)

    def test_author_long(self):
        audio = ASF(self.filename)
        # 2 ** 16 - 2 bytes encoded text + 2 bytes termination
        just_small_enough = u"a" * (((2 ** 16) // 2) - 2)
        audio["Author"] = [just_small_enough]
        audio.save()
        self.assertTrue(audio.to_content_description)
        self.assertFalse(audio.to_metadata_library)

        audio["Author"] = [just_small_enough + u"a"]
        audio.save()
        self.assertFalse(audio.to_content_description)
        self.assertTrue(audio.to_metadata_library)

    def test_multi_order(self):
        audio = ASF(self.filename)
        audio["Author"] = [u"a", u"b", u"c"]
        audio.save()
        audio = ASF(self.filename)
        self.assertEqual(audio["Author"], [u"a", u"b", u"c"])

    def test_multi_order_extended(self):
        audio = ASF(self.filename)
        audio["WM/Composer"] = [u"a", u"b", u"c"]
        audio.save()
        audio = ASF(self.filename)
        self.assertEqual(audio["WM/Composer"], [u"a", u"b", u"c"])

    def test_non_text_type(self):
        audio = ASF(self.filename)
        audio["Author"] = [42]
        audio.save()
        self.assertFalse(audio.to_content_description)
        new = ASF(self.filename)
        self.assertEqual(new["Author"], [42])

    def test_empty(self):
        audio = ASF(self.filename)
        audio["Author"] = [u"", u""]
        audio["Title"] = [u""]
        audio["Copyright"] = []
        audio.save()

        new = ASF(self.filename)
        self.assertEqual(new["Author"], [u"", u""])
        self.assertEqual(new["Title"], [u""])
        self.assertFalse("Copyright" in new)


class TASFLargeValue(TestCase):

    original = os.path.join(DATA_DIR, "silence-1.wma")

    def setUp(self):
        self.filename = get_temp_copy(self.original)

    def tearDown(self):
        os.unlink(self.filename)

    def test_save_small_bytearray(self):
        audio = ASF(self.filename)
        audio["QL/LargeObject"] = [ASFValue(b"." * 0xFFFF, BYTEARRAY)]
        audio.save()
        self.failIf(
            "QL/LargeObject" not in audio.to_extended_content_description)
        self.failIf("QL/LargeObject" in audio.to_metadata)
        self.failIf("QL/LargeObject" in dict(audio.to_metadata_library))

    def test_save_large_bytearray(self):
        audio = ASF(self.filename)
        audio["QL/LargeObject"] = [ASFValue(b"." * (0xFFFF + 1), BYTEARRAY)]
        audio.save()
        self.failIf("QL/LargeObject" in audio.to_extended_content_description)
        self.failIf("QL/LargeObject" in audio.to_metadata)
        self.failIf("QL/LargeObject" not in dict(audio.to_metadata_library))

    def test_save_small_string(self):
        audio = ASF(self.filename)
        audio["QL/LargeObject"] = [ASFValue("." * (0x7FFF - 1), UNICODE)]
        audio.save()
        self.failIf(
            "QL/LargeObject" not in audio.to_extended_content_description)
        self.failIf("QL/LargeObject" in audio.to_metadata)
        self.failIf("QL/LargeObject" in dict(audio.to_metadata_library))

    def test_save_large_string(self):
        audio = ASF(self.filename)
        audio["QL/LargeObject"] = [ASFValue("." * 0x7FFF, UNICODE)]
        audio.save()
        self.failIf("QL/LargeObject" in audio.to_extended_content_description)
        self.failIf("QL/LargeObject" in audio.to_metadata)
        self.failIf("QL/LargeObject" not in dict(audio.to_metadata_library))

    def test_save_guid(self):
        # https://github.com/quodlibet/mutagen/issues/81
        audio = ASF(self.filename)
        audio["QL/GuidObject"] = [ASFValue(b" " * 16, GUID)]
        audio.save()
        self.failIf("QL/GuidObject" in audio.to_extended_content_description)
        self.failIf("QL/GuidObject" in audio.to_metadata)
        self.failIf("QL/GuidObject" not in dict(audio.to_metadata_library))


class TASFSave(TestCase):
    # https://github.com/quodlibet/mutagen/issues/81#issuecomment-207014936

    original = os.path.join(DATA_DIR, "silence-1.wma")

    def setUp(self):
        self.filename = get_temp_copy(self.original)
        self.audio = ASF(self.filename)

    def tearDown(self):
        os.unlink(self.filename)

    def test_save_filename(self):
        self.audio.save(self.audio.filename)

    def test_multiple_delete(self):
        self.audio["large_value1"] = "#" * 50000
        self.audio.save()

        audio = ASF(self.filename)
        for tag in audio.keys():
            del(audio[tag])
            audio.save()

    def test_readd_objects(self):
        header = self.audio._header
        del header.objects[:]
        self.audio.save()
        self.assertTrue(header.get_child(ContentDescriptionObject.GUID))
        self.assertTrue(
            header.get_child(ExtendedContentDescriptionObject.GUID))
        self.assertTrue(header.get_child(HeaderExtensionObject.GUID))
        ext = header.get_child(HeaderExtensionObject.GUID)
        self.assertTrue(ext.get_child(MetadataObject.GUID))
        self.assertTrue(ext.get_child(MetadataLibraryObject.GUID))

    def test_keep_others(self):
        self.audio.save()
        new = ASF(self.filename)
        self.assertTrue(new._header.get_child(CodecListObject.GUID))

    def test_padding(self):
        old_tags = sorted(self.audio.items())

        def get_padding(fn):
            header = ASF(fn)._header
            return len(header.get_child(PaddingObject.GUID).data)

        for i in [0, 1, 2, 3, 42, 100, 5000, 30432, 1]:

            def padding_cb(info):
                self.assertEqual(info.size, 30432)
                return i

            self.audio.save(padding=padding_cb)
            self.assertEqual(get_padding(self.filename), i)

        last = ASF(self.filename)
        self.assertEqual(sorted(last.items()), old_tags)
