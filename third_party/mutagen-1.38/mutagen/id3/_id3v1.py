# -*- coding: utf-8 -*-
# Copyright (C) 2005  Michael Urman
#               2006  Lukas Lalinsky
#               2013  Christoph Reiter
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.

import errno
from struct import error as StructError, unpack

from mutagen._util import chr_, text_type

from ._frames import TCON, TRCK, COMM, TDRC, TALB, TPE1, TIT2


def find_id3v1(fileobj):
    """Returns a tuple of (id3tag, offset_to_end) or (None, 0)

    offset mainly because we used to write too short tags in some cases and
    we need the offset to delete them.
    """

    # id3v1 is always at the end (after apev2)

    extra_read = b"APETAGEX".index(b"TAG")

    try:
        fileobj.seek(-128 - extra_read, 2)
    except IOError as e:
        if e.errno == errno.EINVAL:
            # If the file is too small, might be ok since we wrote too small
            # tags at some point. let's see how the parsing goes..
            fileobj.seek(0, 0)
        else:
            raise

    data = fileobj.read(128 + extra_read)
    try:
        idx = data.index(b"TAG")
    except ValueError:
        return (None, 0)
    else:
        # FIXME: make use of the apev2 parser here
        # if TAG is part of APETAGEX assume this is an APEv2 tag
        try:
            ape_idx = data.index(b"APETAGEX")
        except ValueError:
            pass
        else:
            if idx == ape_idx + extra_read:
                return (None, 0)

        tag = ParseID3v1(data[idx:])
        if tag is None:
            return (None, 0)

        offset = idx - len(data)
        return (tag, offset)


# ID3v1.1 support.
def ParseID3v1(data):
    """Parse an ID3v1 tag, returning a list of ID3v2.4 frames.

    Returns a {frame_name: frame} dict or None.
    """

    try:
        data = data[data.index(b"TAG"):]
    except ValueError:
        return None
    if 128 < len(data) or len(data) < 124:
        return None

    # Issue #69 - Previous versions of Mutagen, when encountering
    # out-of-spec TDRC and TYER frames of less than four characters,
    # wrote only the characters available - e.g. "1" or "" - into the
    # year field. To parse those, reduce the size of the year field.
    # Amazingly, "0s" works as a struct format string.
    unpack_fmt = "3s30s30s30s%ds29sBB" % (len(data) - 124)

    try:
        tag, title, artist, album, year, comment, track, genre = unpack(
            unpack_fmt, data)
    except StructError:
        return None

    if tag != b"TAG":
        return None

    def fix(data):
        return data.split(b"\x00")[0].strip().decode('latin1')

    title, artist, album, year, comment = map(
        fix, [title, artist, album, year, comment])

    frames = {}
    if title:
        frames["TIT2"] = TIT2(encoding=0, text=title)
    if artist:
        frames["TPE1"] = TPE1(encoding=0, text=[artist])
    if album:
        frames["TALB"] = TALB(encoding=0, text=album)
    if year:
        frames["TDRC"] = TDRC(encoding=0, text=year)
    if comment:
        frames["COMM"] = COMM(
            encoding=0, lang="eng", desc="ID3v1 Comment", text=comment)
    # Don't read a track number if it looks like the comment was
    # padded with spaces instead of nulls (thanks, WinAmp).
    if track and ((track != 32) or (data[-3] == b'\x00'[0])):
        frames["TRCK"] = TRCK(encoding=0, text=str(track))
    if genre != 255:
        frames["TCON"] = TCON(encoding=0, text=str(genre))
    return frames


def MakeID3v1(id3):
    """Return an ID3v1.1 tag string from a dict of ID3v2.4 frames."""

    v1 = {}

    for v2id, name in {"TIT2": "title", "TPE1": "artist",
                       "TALB": "album"}.items():
        if v2id in id3:
            text = id3[v2id].text[0].encode('latin1', 'replace')[:30]
        else:
            text = b""
        v1[name] = text + (b"\x00" * (30 - len(text)))

    if "COMM" in id3:
        cmnt = id3["COMM"].text[0].encode('latin1', 'replace')[:28]
    else:
        cmnt = b""
    v1["comment"] = cmnt + (b"\x00" * (29 - len(cmnt)))

    if "TRCK" in id3:
        try:
            v1["track"] = chr_(+id3["TRCK"])
        except ValueError:
            v1["track"] = b"\x00"
    else:
        v1["track"] = b"\x00"

    if "TCON" in id3:
        try:
            genre = id3["TCON"].genres[0]
        except IndexError:
            pass
        else:
            if genre in TCON.GENRES:
                v1["genre"] = chr_(TCON.GENRES.index(genre))
    if "genre" not in v1:
        v1["genre"] = b"\xff"

    if "TDRC" in id3:
        year = text_type(id3["TDRC"]).encode('ascii')
    elif "TYER" in id3:
        year = text_type(id3["TYER"]).encode('ascii')
    else:
        year = b""
    v1["year"] = (year + b"\x00\x00\x00\x00")[:4]

    return (
        b"TAG" +
        v1["title"] +
        v1["artist"] +
        v1["album"] +
        v1["year"] +
        v1["comment"] +
        v1["track"] +
        v1["genre"]
    )
