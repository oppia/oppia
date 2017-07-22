# -*- coding: utf-8 -*-
# Copyright (C) 2005  Michael Urman
#               2006  Lukas Lalinsky
#               2013  Christoph Reiter
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.

"""ID3v2 reading and writing.

This is based off of the following references:

* http://id3.org/id3v2.4.0-structure
* http://id3.org/id3v2.4.0-frames
* http://id3.org/id3v2.3.0
* http://id3.org/id3v2-00
* http://id3.org/ID3v1

Its largest deviation from the above (versions 2.3 and 2.2) is that it
will not interpret the / characters as a separator, and will almost
always accept null separators to generate multi-valued text frames.

Because ID3 frame structure differs between frame types, each frame is
implemented as a different class (e.g. TIT2 as mutagen.id3.TIT2). Each
frame's documentation contains a list of its attributes.

Since this file's documentation is a little unwieldy, you are probably
interested in the :class:`ID3` class to start with.
"""

from ._file import ID3, ID3FileType, delete, ID3v1SaveOptions
from ._specs import Encoding, PictureType, CTOCFlags, ID3TimeStamp
from ._frames import Frames, Frames_2_2, Frame, TextFrame, UrlFrame, \
    UrlFrameU, TimeStampTextFrame, BinaryFrame, NumericPartTextFrame, \
    NumericTextFrame, PairedTextFrame
from ._util import ID3NoHeaderError, error, ID3UnsupportedVersionError
from ._id3v1 import ParseID3v1, MakeID3v1
from ._tags import ID3Tags

# deprecated
from ._util import ID3EncryptionUnsupportedError, ID3JunkFrameError, \
    ID3BadUnsynchData, ID3BadCompressedData, ID3TagError, ID3Warning, \
    BitPaddedInt as _BitPaddedIntForPicard


for f in Frames:
    globals()[f] = Frames[f]
for f in Frames_2_2:
    globals()[f] = Frames_2_2[f]

# support open(filename) as interface
Open = ID3

# pyflakes
ID3, ID3FileType, delete, ID3v1SaveOptions, Encoding, PictureType, CTOCFlags,
ID3TimeStamp, Frames, Frames_2_2, Frame, TextFrame, UrlFrame, UrlFrameU,
TimeStampTextFrame, BinaryFrame, NumericPartTextFrame, NumericTextFrame,
PairedTextFrame, ID3NoHeaderError, error, ID3UnsupportedVersionError,
ParseID3v1, MakeID3v1, ID3Tags, ID3EncryptionUnsupportedError,
ID3JunkFrameError, ID3BadUnsynchData, ID3BadCompressedData, ID3TagError,
ID3Warning


# Workaround for http://tickets.musicbrainz.org/browse/PICARD-833
class _DummySpecForPicard(object):
    write = None

EncodedTextSpec = MultiSpec = _DummySpecForPicard
BitPaddedInt = _BitPaddedIntForPicard


__all__ = ['ID3', 'ID3FileType', 'Frames', 'Open', 'delete']
