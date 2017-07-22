# -*- coding: utf-8 -*-
# Copyright 2016 Christoph Reiter
#
# Permission is hereby granted, free of charge, to any person obtaining
# a copy of this software and associated documentation files (the
# "Software"), to deal in the Software without restriction, including
# without limitation the rights to use, copy, modify, merge, publish,
# distribute, sublicense, and/or sell copies of the Software, and to
# permit persons to whom the Software is furnished to do so, subject to
# the following conditions:
#
# The above copyright notice and this permission notice shall be
# included in all copies or substantial portions of the Software.

import os
import sys
import ctypes
import codecs

from . import _winapi as winapi
from ._compat import text_type, PY3, PY2, url2pathname, urlparse, quote, \
    unquote, urlunparse


is_win = os.name == "nt"
is_unix = not is_win
is_darwin = sys.platform == "darwin"

_surrogatepass = "strict" if PY2 else "surrogatepass"


def _normalize_codec(codec, _cache={}):
    """Raises LookupError"""

    try:
        return _cache[codec]
    except KeyError:
        _cache[codec] = codecs.lookup(codec).name
        return _cache[codec]


def _swap_bytes(data):
    """swaps bytes for 16 bit, leaves remaining trailing bytes alone"""

    a, b = data[1::2], data[::2]
    data = bytearray().join(bytearray(x) for x in zip(a, b))
    if len(b) > len(a):
        data += b[-1:]
    return bytes(data)


def _codec_fails_on_encode_surrogates(codec, _cache={}):
    """Returns if a codec fails correctly when passing in surrogates with
    a surrogatepass/surrogateescape error handler. Some codecs were broken
    in Python <3.4
    """

    try:
        return _cache[codec]
    except KeyError:
        try:
            u"\uD800\uDC01".encode(codec)
        except UnicodeEncodeError:
            _cache[codec] = True
        else:
            _cache[codec] = False
        return _cache[codec]


def _codec_can_decode_with_surrogatepass(codec, _cache={}):
    """Returns if a codec supports the surrogatepass error handler when
    decoding. Some codecs were broken in Python <3.4
    """

    try:
        return _cache[codec]
    except KeyError:
        try:
            u"\ud83d".encode(
                codec, _surrogatepass).decode(codec, _surrogatepass)
        except UnicodeDecodeError:
            _cache[codec] = False
        else:
            _cache[codec] = True
        return _cache[codec]


def _bytes2winpath(data, codec):
    """Like data.decode(codec, 'surrogatepass') but makes utf-16-le/be work
    on Python < 3.4 + Windows

    https://bugs.python.org/issue27971

    Raises UnicodeDecodeError, LookupError
    """

    try:
        return data.decode(codec, _surrogatepass)
    except UnicodeDecodeError:
        if not _codec_can_decode_with_surrogatepass(codec):
            if _normalize_codec(codec) == "utf-16-be":
                data = _swap_bytes(data)
                codec = "utf-16-le"
            if _normalize_codec(codec) == "utf-16-le":
                buffer_ = ctypes.create_string_buffer(data + b"\x00\x00")
                value = ctypes.wstring_at(buffer_, len(data) // 2)
                if value.encode("utf-16-le", _surrogatepass) != data:
                    raise
                return value
            else:
                raise
        else:
            raise


def _winpath2bytes_py3(text, codec):
    """Fallback implementation for text including surrogates"""

    # merge surrogate codepoints
    if _normalize_codec(codec).startswith("utf-16"):
        # fast path, utf-16 merges anyway
        return text.encode(codec, _surrogatepass)
    return _bytes2winpath(
        text.encode("utf-16-le", _surrogatepass),
        "utf-16-le").encode(codec, _surrogatepass)


if PY2:
    def _winpath2bytes(text, codec):
        return text.encode(codec)
else:
    def _winpath2bytes(text, codec):
        if _codec_fails_on_encode_surrogates(codec):
            try:
                return text.encode(codec)
            except UnicodeEncodeError:
                return _winpath2bytes_py3(text, codec)
        else:
            return _winpath2bytes_py3(text, codec)


def _fsn2legacy(path):
    """Takes a fsnative path and returns a path that can be put into os.environ
    or sys.argv. Might result in a mangled path on Python2 + Windows.
    Can't fail.

    Args:
        path (fsnative)
    Returns:
        str
    """

    if PY2 and is_win:
        return path.encode(_encoding, "replace")
    return path


def _fsnative(text):
    if not isinstance(text, text_type):
        raise TypeError("%r needs to be a text type (%r)" % (text, text_type))

    if is_unix:
        # First we go to bytes so we can be sure we have a valid source.
        # Theoretically we should fail here in case we have a non-unicode
        # encoding. But this would make everything complicated and there is
        # no good way to handle a failure from the user side. Instead
        # fall back to utf-8 which is the most likely the right choice in
        # a mis-configured environment
        encoding = _encoding
        try:
            path = text.encode(encoding, _surrogatepass)
        except UnicodeEncodeError:
            path = text.encode("utf-8", _surrogatepass)

        if b"\x00" in path:
            path = path.replace(b"\x00", fsn2bytes(_fsnative(u"\uFFFD"), None))

        if PY3:
            return path.decode(_encoding, "surrogateescape")
        return path
    else:
        if u"\x00" in text:
            text = text.replace(u"\x00", u"\uFFFD")
        return text


def _create_fsnative(type_):
    # a bit of magic to make fsnative(u"foo") and isinstance(path, fsnative)
    # work

    class meta(type):

        def __instancecheck__(self, instance):
            return _typecheck_fsnative(instance)

        def __subclasscheck__(self, subclass):
            return issubclass(subclass, type_)

    class impl(object):
        """fsnative(text=u"")

        Args:
            text (text): The text to convert to a path
        Returns:
            fsnative: The new path.
        Raises:
            TypeError: In case something other then `text` has been passed

        This type is a virtual base class for the real path type.
        Instantiating it returns an instance of the real path type and it
        overrides instance and subclass checks so that `isinstance` and
        `issubclass` checks work:

        ::

            isinstance(fsnative(u"foo"), fsnative) == True
            issubclass(type(fsnative(u"foo")), fsnative) == True

        The real returned type is:

        - **Python 2 + Windows:** :obj:`python:unicode`, with ``surrogates``,
          without ``null``
        - **Python 2 + Unix:** :obj:`python:str`, without ``null``
        - **Python 3 + Windows:** :obj:`python3:str`, with ``surrogates``,
          without ``null``
        - **Python 3 + Unix:** :obj:`python3:str`, with ``surrogates``, without
          ``null``, without code points not encodable with the locale encoding

        Constructing a `fsnative` can't fail.

        Passing a `fsnative` to :func:`open` will never lead to `ValueError`
        or `TypeError`.

        Any operation on `fsnative` can also use the `str` type, as long as
        the `str` only contains ASCII and no NULL.
        """

        def __new__(cls, text=u""):
            return _fsnative(text)

    new_type = meta("fsnative", (object,), dict(impl.__dict__))
    new_type.__module__ = "senf"
    return new_type


fsnative_type = text_type if is_win or PY3 else bytes
fsnative = _create_fsnative(fsnative_type)


def _typecheck_fsnative(path):
    """
    Args:
        path (object)
    Returns:
        bool: if path is a fsnative
    """

    if not isinstance(path, fsnative_type):
        return False

    if PY3 or is_win:
        if u"\x00" in path:
            return False

        if is_unix and not _is_unicode_encoding:
            try:
                path.encode(_encoding, "surrogateescape")
            except UnicodeEncodeError:
                return False
    elif b"\x00" in path:
        return False

    return True


def _fsn2native(path):
    """
    Args:
        path (fsnative)
    Returns:
        `text` on Windows, `bytes` on Unix
    Raises:
        TypeError: in case the type is wrong or the ´str` on Py3 + Unix
            can't be converted to `bytes`

    This helper allows to validate the type and content of a path.
    To reduce overhead the encoded value for Py3 + Unix is returned so
    it can be reused.
    """

    if not isinstance(path, fsnative_type):
        raise TypeError("path needs to be %s, not %s" % (
            fsnative_type.__name__, type(path).__name__))

    if is_unix:
        if PY3:
            try:
                path = path.encode(_encoding, "surrogateescape")
            except UnicodeEncodeError:
                assert not _is_unicode_encoding
                # This look more like ValueError, but raising only one error
                # makes things simpler... also one could say str + surrogates
                # is its own type
                raise TypeError(
                    "path contained Unicode code points not valid in"
                    "the current path encoding. To create a valid "
                    "path from Unicode use text2fsn()")

        if b"\x00" in path:
            raise TypeError("fsnative can't contain nulls")
    else:
        if u"\x00" in path:
            raise TypeError("fsnative can't contain nulls")

    return path


def _get_encoding():
    """The encoding used for paths, argv, environ, stdout and stdin"""

    encoding = sys.getfilesystemencoding()
    if encoding is None:
        if is_darwin:
            encoding = "utf-8"
        elif is_win:
            encoding = "mbcs"
        else:
            encoding = "ascii"
    encoding = _normalize_codec(encoding)
    return encoding


_encoding = _get_encoding()
_is_unicode_encoding = _encoding.startswith("utf")


def path2fsn(path):
    """
    Args:
        path (pathlike): The path to convert
    Returns:
        `fsnative`
    Raises:
        TypeError: In case the type can't be converted to a `fsnative`
        ValueError: In case conversion fails

    Returns a `fsnative` path for a `pathlike`.
    """

    # allow mbcs str on py2+win and bytes on py3
    if PY2:
        if is_win:
            if isinstance(path, bytes):
                path = path.decode(_encoding)
        else:
            if isinstance(path, text_type):
                path = path.encode(_encoding)
        if "\x00" in path:
            raise ValueError("embedded null")
    else:
        path = getattr(os, "fspath", lambda x: x)(path)
        if isinstance(path, bytes):
            if b"\x00" in path:
                raise ValueError("embedded null")
            path = path.decode(_encoding, "surrogateescape")
        elif is_unix and isinstance(path, str):
            # make sure we can encode it and this is not just some random
            # unicode string
            data = path.encode(_encoding, "surrogateescape")
            if b"\x00" in data:
                raise ValueError("embedded null")
        else:
            if u"\x00" in path:
                raise ValueError("embedded null")

    if not isinstance(path, fsnative_type):
        raise TypeError("path needs to be %s", fsnative_type.__name__)

    return path


def fsn2text(path, strict=False):
    """
    Args:
        path (fsnative): The path to convert
        strict (bool): Fail in case the conversion is not reversible
    Returns:
        `text`
    Raises:
        TypeError: In case no `fsnative` has been passed
        ValueError: In case ``strict`` was True and the conversion failed

    Converts a `fsnative` path to `text`.

    Can be used to pass a path to some unicode API, like for example a GUI
    toolkit.

    If ``strict`` is True the conversion will fail in case it is not
    reversible. This can be useful for converting program arguments that are
    supposed to be text and erroring out in case they are not.

    Encoding with a Unicode encoding will always succeed with the result.
    """

    path = _fsn2native(path)

    errors = "strict" if strict else "replace"

    if is_win:
        return path.encode("utf-16-le", _surrogatepass).decode("utf-16-le",
                                                               errors)
    else:
        return path.decode(_encoding, errors)


def text2fsn(text):
    """
    Args:
        text (text): The text to convert
    Returns:
        `fsnative`
    Raises:
        TypeError: In case no `text` has been passed

    Takes `text` and converts it to a `fsnative`.

    This operation is not reversible and can't fail.
    """

    return fsnative(text)


def fsn2bytes(path, encoding):
    """
    Args:
        path (fsnative): The path to convert
        encoding (`str` or `None`): `None` if you don't care about Windows
    Returns:
        `bytes`
    Raises:
        TypeError: If no `fsnative` path is passed
        ValueError: If encoding fails or no encoding is given

    Converts a `fsnative` path to `bytes`.

    The passed *encoding* is only used on platforms where paths are not
    associated with an encoding (Windows for example). If you don't care about
    Windows you can pass `None`.

    For Windows paths, lone surrogates will be encoded like normal code points
    and surrogate pairs will be merged before encoding. In case of ``utf-8``
    or ``utf-16-le`` this is equal to the `WTF-8 and WTF-16 encoding
    <https://simonsapin.github.io/wtf-8/>`__.
    """

    path = _fsn2native(path)

    if is_win:
        if encoding is None:
            raise ValueError("invalid encoding %r" % encoding)

        try:
            return _winpath2bytes(path, encoding)
        except LookupError:
            raise ValueError("invalid encoding %r" % encoding)
    else:
        return path


def bytes2fsn(data, encoding):
    """
    Args:
        data (bytes): The data to convert
        encoding (`str` or `None`): `None` if you don't care about Windows
    Returns:
        `fsnative`
    Raises:
        TypeError: If no `bytes` path is passed
        ValueError: If decoding fails or no encoding is given

    Turns `bytes` to a `fsnative` path.

    The passed *encoding* is only used on platforms where paths are not
    associated with an encoding (Windows for example). If you don't care about
    Windows you can pass `None`.
    """

    if not isinstance(data, bytes):
        raise TypeError("data needs to be bytes")

    if is_win:
        if encoding is None:
            raise ValueError("invalid encoding %r" % encoding)
        try:
            path = _bytes2winpath(data, encoding)
        except LookupError:
            raise ValueError("invalid encoding %r" % encoding)
        if u"\x00" in path:
            raise ValueError("contains nulls")
        return path
    else:
        if b"\x00" in data:
            raise ValueError("contains nulls")
        if PY2:
            return data
        else:
            return data.decode(_encoding, "surrogateescape")


def uri2fsn(uri):
    """
    Args:
        uri (`text` or :obj:`python:str`): A file URI
    Returns:
        `fsnative`
    Raises:
        TypeError: In case an invalid type is passed
        ValueError: In case the URI isn't a valid file URI

    Takes a file URI and returns a `fsnative` path
    """

    if PY2:
        if isinstance(uri, text_type):
            uri = uri.encode("utf-8")
        if not isinstance(uri, bytes):
            raise TypeError("uri needs to be ascii str or unicode")
    else:
        if not isinstance(uri, str):
            raise TypeError("uri needs to be str")

    parsed = urlparse(uri)
    scheme = parsed.scheme
    netloc = parsed.netloc
    path = parsed.path

    if scheme != "file":
        raise ValueError("Not a file URI: %r" % uri)

    if not path:
        raise ValueError("Invalid file URI: %r" % uri)

    uri = urlunparse(parsed)[7:]

    if is_win:
        path = url2pathname(uri)
        if netloc:
            path = "\\\\" + path
        if PY2:
            path = path.decode("utf-8")
        if u"\x00" in path:
            raise ValueError("embedded null")
        return path
    else:
        path = url2pathname(uri)
        if "\x00" in path:
            raise ValueError("embedded null")
        if PY3:
            path = fsnative(path)
        return path


def fsn2uri(path):
    """
    Args:
        path (fsnative): The path to convert to an URI
    Returns:
        `text`: An ASCII only URI
    Raises:
        TypeError: If no `fsnative` was passed
        ValueError: If the path can't be converted

    Takes a `fsnative` path and returns a file URI.

    On Windows non-ASCII characters will be encoded using utf-8 and then
    percent encoded.
    """

    path = _fsn2native(path)

    def _quote_path(path):
        # RFC 2396
        path = quote(path, "/:@&=+$,")
        if PY2:
            path = path.decode("ascii")
        return path

    if is_win:
        buf = ctypes.create_unicode_buffer(winapi.INTERNET_MAX_URL_LENGTH)
        length = winapi.DWORD(winapi.INTERNET_MAX_URL_LENGTH)
        flags = 0
        try:
            winapi.UrlCreateFromPathW(path, buf, ctypes.byref(length), flags)
        except WindowsError as e:
            raise ValueError(e)
        uri = buf[:length.value]

        # For some reason UrlCreateFromPathW escapes some chars outside of
        # ASCII and some not. Unquote and re-quote with utf-8.
        if PY3:
            # latin-1 maps code points directly to bytes, which is what we want
            uri = unquote(uri, "latin-1")
        else:
            # Python 2 does what we want by default
            uri = unquote(uri)

        return _quote_path(uri.encode("utf-8", _surrogatepass))

    else:
        return u"file://" + _quote_path(path)
