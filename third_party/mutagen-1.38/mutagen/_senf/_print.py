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

import sys
import os
import ctypes

from ._fsnative import _encoding, is_win, is_unix, _surrogatepass
from ._compat import text_type, PY2, PY3
from ._winansi import AnsiState, ansi_split
from . import _winapi as winapi


def print_(*objects, **kwargs):
    """print_(*objects, sep=None, end=None, file=None, flush=False)

    Args:
        objects (object): zero or more objects to print
        sep (str): Object separator to use, defaults to ``" "``
        end (str): Trailing string to use, defaults to ``"\\n"``.
            If end is ``"\\n"`` then `os.linesep` is used.
        file (object): A file-like object, defaults to `sys.stdout`
        flush (bool): If the file stream should be flushed
    Raises:
        EnvironmentError

    Like print(), but:

    * Supports printing filenames under Unix + Python 3 and Windows + Python 2
    * Emulates ANSI escape sequence support under Windows
    * Never fails due to encoding/decoding errors. Tries hard to get everything
      on screen as is, but will fall back to "?" if all fails.

    This does not conflict with ``colorama``, but will not use it on Windows.
    """

    sep = kwargs.get("sep")
    sep = sep if sep is not None else " "
    end = kwargs.get("end")
    end = end if end is not None else "\n"
    file = kwargs.get("file")
    file = file if file is not None else sys.stdout
    flush = bool(kwargs.get("flush", False))

    if is_win:
        _print_windows(objects, sep, end, file, flush)
    else:
        _print_unix(objects, sep, end, file, flush)


def _print_unix(objects, sep, end, file, flush):
    """A print_() implementation which writes bytes"""

    encoding = _encoding

    if isinstance(sep, text_type):
        sep = sep.encode(encoding, "replace")
    if not isinstance(sep, bytes):
        raise TypeError

    if isinstance(end, text_type):
        end = end.encode(encoding, "replace")
    if not isinstance(end, bytes):
        raise TypeError

    if end == b"\n":
        end = os.linesep
        if PY3:
            end = end.encode("ascii")

    parts = []
    for obj in objects:
        if not isinstance(obj, text_type) and not isinstance(obj, bytes):
            obj = text_type(obj)
        if isinstance(obj, text_type):
            if PY2:
                obj = obj.encode(encoding, "replace")
            else:
                try:
                    obj = obj.encode(encoding, "surrogateescape")
                except UnicodeEncodeError:
                    obj = obj.encode(encoding, "replace")
        assert isinstance(obj, bytes)
        parts.append(obj)

    data = sep.join(parts) + end
    assert isinstance(data, bytes)

    file = getattr(file, "buffer", file)

    try:
        file.write(data)
    except TypeError:
        if PY3:
            # For StringIO, first try with surrogates
            surr_data = data.decode(encoding, "surrogateescape")
            try:
                file.write(surr_data)
            except (TypeError, ValueError):
                file.write(data.decode(encoding, "replace"))
        else:
            # for file like objects with don't support bytes
            file.write(data.decode(encoding, "replace"))

    if flush:
        file.flush()


ansi_state = AnsiState()


def _print_windows(objects, sep, end, file, flush):
    """The windows implementation of print_()"""

    h = winapi.INVALID_HANDLE_VALUE

    try:
        fileno = file.fileno()
    except (EnvironmentError, AttributeError):
        pass
    else:
        if fileno == 1:
            h = winapi.GetStdHandle(winapi.STD_OUTPUT_HANDLE)
        elif fileno == 2:
            h = winapi.GetStdHandle(winapi.STD_ERROR_HANDLE)

    encoding = _encoding

    parts = []
    for obj in objects:
        if isinstance(obj, bytes):
            obj = obj.decode(encoding, "replace")
        if not isinstance(obj, text_type):
            obj = text_type(obj)
        parts.append(obj)

    if isinstance(sep, bytes):
        sep = sep.decode(encoding, "replace")
    if not isinstance(sep, text_type):
        raise TypeError

    if isinstance(end, bytes):
        end = end.decode(encoding, "replace")
    if not isinstance(end, text_type):
        raise TypeError

    if end == u"\n":
        end = os.linesep

    text = sep.join(parts) + end
    assert isinstance(text, text_type)

    is_console = True
    if h == winapi.INVALID_HANDLE_VALUE:
        is_console = False
    else:
        # get the default value
        info = winapi.CONSOLE_SCREEN_BUFFER_INFO()
        if not winapi.GetConsoleScreenBufferInfo(h, ctypes.byref(info)):
            is_console = False

    if is_console:
        # make sure we flush before we apply any console attributes
        file.flush()

        # try to force a utf-8 code page, use the output CP if that fails
        cp = winapi.GetConsoleOutputCP()
        try:
            encoding = "utf-8"
            if winapi.SetConsoleOutputCP(65001) == 0:
                encoding = None

            for is_ansi, part in ansi_split(text):
                if is_ansi:
                    ansi_state.apply(h, part)
                else:
                    if encoding is not None:
                        data = part.encode(encoding, _surrogatepass)
                    else:
                        data = _encode_codepage(cp, part)
                    os.write(fileno, data)
        finally:
            # reset the code page to what we had before
            winapi.SetConsoleOutputCP(cp)
    else:
        # try writing bytes first, so in case of Python 2 StringIO we get
        # the same type on all platforms
        try:
            file.write(text.encode("utf-8", _surrogatepass))
        except (TypeError, ValueError):
            file.write(text)

        if flush:
            file.flush()


def _readline_windows():
    """Raises OSError"""

    try:
        fileno = sys.stdin.fileno()
    except (EnvironmentError, AttributeError):
        fileno = -1

    # In case stdin is replaced, read from that
    if fileno != 0:
        return _readline_windows_fallback()

    h = winapi.GetStdHandle(winapi.STD_INPUT_HANDLE)
    if h == winapi.INVALID_HANDLE_VALUE:
        return _readline_windows_fallback()

    buf_size = 1024
    buf = ctypes.create_string_buffer(buf_size * ctypes.sizeof(winapi.WCHAR))
    read = winapi.DWORD()

    text = u""
    while True:
        if winapi.ReadConsoleW(
                h, buf, buf_size, ctypes.byref(read), None) == 0:
            if not text:
                return _readline_windows_fallback()
            raise ctypes.WinError()
        data = buf[:read.value * ctypes.sizeof(winapi.WCHAR)]
        text += data.decode("utf-16-le", _surrogatepass)
        if text.endswith(u"\r\n"):
            return text[:-2]


def _decode_codepage(codepage, data):
    """
    Args:
        codepage (int)
        data (bytes)
    Returns:
        `text`

    Decodes data using the given codepage. If some data can't be decoded
    using the codepage it will not fail.
    """

    assert isinstance(data, bytes)

    if not data:
        return u""

    # get the required buffer length first
    length = winapi.MultiByteToWideChar(codepage, 0, data, len(data), None, 0)
    if length == 0:
        raise ctypes.WinError()

    # now decode
    buf = ctypes.create_unicode_buffer(length)
    length = winapi.MultiByteToWideChar(
        codepage, 0, data, len(data), buf, length)
    if length == 0:
        raise ctypes.WinError()

    return buf[:]


def _encode_codepage(codepage, text):
    """
    Args:
        codepage (int)
        text (text)
    Returns:
        `bytes`

    Encode text using the given code page. Will not fail if a char
    can't be encoded using that codepage.
    """

    assert isinstance(text, text_type)

    if not text:
        return b""

    size = (len(text.encode("utf-16-le", _surrogatepass)) //
            ctypes.sizeof(winapi.WCHAR))

    # get the required buffer size
    length = winapi.WideCharToMultiByte(
        codepage, 0, text, size, None, 0, None, None)
    if length == 0:
        raise ctypes.WinError()

    # decode to the buffer
    buf = ctypes.create_string_buffer(length)
    length = winapi.WideCharToMultiByte(
        codepage, 0, text, size, buf, length, None, None)
    if length == 0:
        raise ctypes.WinError()
    return buf[:length]


def _readline_windows_fallback():
    # In case reading from the console failed (maybe we get piped data)
    # we assume the input was generated according to the output encoding.
    # Got any better ideas?
    assert is_win
    cp = winapi.GetConsoleOutputCP()
    data = getattr(sys.stdin, "buffer", sys.stdin).readline().rstrip(b"\r\n")
    return _decode_codepage(cp, data)


def _readline_default():
    assert is_unix
    data = getattr(sys.stdin, "buffer", sys.stdin).readline().rstrip(b"\r\n")
    if PY3:
        return data.decode(_encoding, "surrogateescape")
    else:
        return data


def _readline():
    if is_win:
        return _readline_windows()
    else:
        return _readline_default()


def input_(prompt=None):
    """
    Args:
        prompt (object): Prints the passed object to stdout without
            adding a trailing newline
    Returns:
        `fsnative`
    Raises:
        EnvironmentError

    Like :func:`python3:input` but returns a `fsnative` and allows printing
    filenames as prompt to stdout.

    Use :func:`fsn2text` on the result if you just want to deal with text.
    """

    if prompt is not None:
        print_(prompt, end="")

    return _readline()
