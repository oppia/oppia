# -*- coding: utf-8 -*-
# Copyright (C) 2014  Evan Purkhiser
#               2014  Ben Ockmore
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.

"""AIFF audio stream information and tags."""

import sys
import struct
from struct import pack

from ._compat import endswith, text_type, reraise
from mutagen import StreamInfo, FileType

from mutagen.id3 import ID3
from mutagen.id3._util import ID3NoHeaderError, error as ID3Error
from mutagen._util import resize_bytes, delete_bytes, MutagenError, loadfile, \
    convert_error

__all__ = ["AIFF", "Open", "delete"]


class error(MutagenError):
    pass


class InvalidChunk(error):
    pass


# based on stdlib's aifc
_HUGE_VAL = 1.79769313486231e+308


def is_valid_chunk_id(id):
    assert isinstance(id, text_type)

    return ((len(id) <= 4) and (min(id) >= u' ') and
            (max(id) <= u'~'))


def read_float(data):  # 10 bytes
    expon, himant, lomant = struct.unpack('>hLL', data)
    sign = 1
    if expon < 0:
        sign = -1
        expon = expon + 0x8000
    if expon == himant == lomant == 0:
        f = 0.0
    elif expon == 0x7FFF:
        f = _HUGE_VAL
    else:
        expon = expon - 16383
        f = (himant * 0x100000000 + lomant) * pow(2.0, expon - 63)
    return sign * f


class IFFChunk(object):
    """Representation of a single IFF chunk"""

    # Chunk headers are 8 bytes long (4 for ID and 4 for the size)
    HEADER_SIZE = 8

    def __init__(self, fileobj, parent_chunk=None):
        self.__fileobj = fileobj
        self.parent_chunk = parent_chunk
        self.offset = fileobj.tell()

        header = fileobj.read(self.HEADER_SIZE)
        if len(header) < self.HEADER_SIZE:
            raise InvalidChunk()

        self.id, self.data_size = struct.unpack('>4si', header)

        try:
            self.id = self.id.decode('ascii')
        except UnicodeDecodeError:
            raise InvalidChunk()

        if not is_valid_chunk_id(self.id):
            raise InvalidChunk()

        self.size = self.HEADER_SIZE + self.data_size
        self.data_offset = fileobj.tell()

    def read(self):
        """Read the chunks data"""

        self.__fileobj.seek(self.data_offset)
        return self.__fileobj.read(self.data_size)

    def write(self, data):
        """Write the chunk data"""

        if len(data) > self.data_size:
            raise ValueError

        self.__fileobj.seek(self.data_offset)
        self.__fileobj.write(data)

    def delete(self):
        """Removes the chunk from the file"""

        delete_bytes(self.__fileobj, self.size, self.offset)
        if self.parent_chunk is not None:
            self.parent_chunk._update_size(
                self.parent_chunk.data_size - self.size)

    def _update_size(self, data_size):
        """Update the size of the chunk"""

        self.__fileobj.seek(self.offset + 4)
        self.__fileobj.write(pack('>I', data_size))
        if self.parent_chunk is not None:
            size_diff = self.data_size - data_size
            self.parent_chunk._update_size(
                self.parent_chunk.data_size - size_diff)
        self.data_size = data_size
        self.size = data_size + self.HEADER_SIZE

    def resize(self, new_data_size):
        """Resize the file and update the chunk sizes"""

        resize_bytes(
            self.__fileobj, self.data_size, new_data_size, self.data_offset)
        self._update_size(new_data_size)


class IFFFile(object):
    """Representation of a IFF file"""

    def __init__(self, fileobj):
        self.__fileobj = fileobj
        self.__chunks = {}

        # AIFF Files always start with the FORM chunk which contains a 4 byte
        # ID before the start of other chunks
        fileobj.seek(0)
        self.__chunks[u'FORM'] = IFFChunk(fileobj)

        # Skip past the 4 byte FORM id
        fileobj.seek(IFFChunk.HEADER_SIZE + 4)

        # Where the next chunk can be located. We need to keep track of this
        # since the size indicated in the FORM header may not match up with the
        # offset determined from the size of the last chunk in the file
        self.__next_offset = fileobj.tell()

        # Load all of the chunks
        while True:
            try:
                chunk = IFFChunk(fileobj, self[u'FORM'])
            except InvalidChunk:
                break
            self.__chunks[chunk.id.strip()] = chunk

            # Calculate the location of the next chunk,
            # considering the pad byte
            self.__next_offset = chunk.offset + chunk.size
            self.__next_offset += self.__next_offset % 2
            fileobj.seek(self.__next_offset)

    def __contains__(self, id_):
        """Check if the IFF file contains a specific chunk"""

        assert isinstance(id_, text_type)

        if not is_valid_chunk_id(id_):
            raise KeyError("AIFF key must be four ASCII characters.")

        return id_ in self.__chunks

    def __getitem__(self, id_):
        """Get a chunk from the IFF file"""

        assert isinstance(id_, text_type)

        if not is_valid_chunk_id(id_):
            raise KeyError("AIFF key must be four ASCII characters.")

        try:
            return self.__chunks[id_]
        except KeyError:
            raise KeyError(
                "%r has no %r chunk" % (self.__fileobj, id_))

    def __delitem__(self, id_):
        """Remove a chunk from the IFF file"""

        assert isinstance(id_, text_type)

        if not is_valid_chunk_id(id_):
            raise KeyError("AIFF key must be four ASCII characters.")

        self.__chunks.pop(id_).delete()

    def insert_chunk(self, id_):
        """Insert a new chunk at the end of the IFF file"""

        assert isinstance(id_, text_type)

        if not is_valid_chunk_id(id_):
            raise KeyError("AIFF key must be four ASCII characters.")

        self.__fileobj.seek(self.__next_offset)
        self.__fileobj.write(pack('>4si', id_.ljust(4).encode('ascii'), 0))
        self.__fileobj.seek(self.__next_offset)
        chunk = IFFChunk(self.__fileobj, self[u'FORM'])
        self[u'FORM']._update_size(self[u'FORM'].data_size + chunk.size)

        self.__chunks[id_] = chunk
        self.__next_offset = chunk.offset + chunk.size


class AIFFInfo(StreamInfo):
    """AIFFInfo()

    AIFF audio stream information.

    Information is parsed from the COMM chunk of the AIFF file

    Attributes:
        length (`float`): audio length, in seconds
        bitrate (`int`): audio bitrate, in bits per second
        channels (`int`): The number of audio channels
        sample_rate (`int`): audio sample rate, in Hz
        sample_size (`int`): The audio sample size
    """

    length = 0
    bitrate = 0
    channels = 0
    sample_rate = 0

    @convert_error(IOError, error)
    def __init__(self, fileobj):
        """Raises error"""

        iff = IFFFile(fileobj)
        try:
            common_chunk = iff[u'COMM']
        except KeyError as e:
            raise error(str(e))

        data = common_chunk.read()
        if len(data) < 18:
            raise error

        info = struct.unpack('>hLh10s', data[:18])
        channels, frame_count, sample_size, sample_rate = info

        self.sample_rate = int(read_float(sample_rate))
        self.sample_size = sample_size
        self.channels = channels
        self.bitrate = channels * sample_size * self.sample_rate
        self.length = frame_count / float(self.sample_rate)

    def pprint(self):
        return u"%d channel AIFF @ %d bps, %s Hz, %.2f seconds" % (
            self.channels, self.bitrate, self.sample_rate, self.length)


class _IFFID3(ID3):
    """A AIFF file with ID3v2 tags"""

    def _pre_load_header(self, fileobj):
        try:
            fileobj.seek(IFFFile(fileobj)[u'ID3'].data_offset)
        except (InvalidChunk, KeyError):
            raise ID3NoHeaderError("No ID3 chunk")

    @convert_error(IOError, error)
    @loadfile(writable=True)
    def save(self, filething, v2_version=4, v23_sep='/', padding=None):
        """Save ID3v2 data to the AIFF file"""

        fileobj = filething.fileobj

        iff_file = IFFFile(fileobj)

        if u'ID3' not in iff_file:
            iff_file.insert_chunk(u'ID3')

        chunk = iff_file[u'ID3']

        try:
            data = self._prepare_data(
                fileobj, chunk.data_offset, chunk.data_size, v2_version,
                v23_sep, padding)
        except ID3Error as e:
            reraise(error, e, sys.exc_info()[2])

        new_size = len(data)
        new_size += new_size % 2  # pad byte
        assert new_size % 2 == 0
        chunk.resize(new_size)
        data += (new_size - len(data)) * b'\x00'
        assert new_size == len(data)
        chunk.write(data)

    @loadfile(writable=True)
    def delete(self, filething):
        """Completely removes the ID3 chunk from the AIFF file"""

        delete(filething)
        self.clear()


@convert_error(IOError, error)
@loadfile(method=False, writable=True)
def delete(filething):
    """Completely removes the ID3 chunk from the AIFF file"""

    try:
        del IFFFile(filething.fileobj)[u'ID3']
    except KeyError:
        pass


class AIFF(FileType):
    """AIFF(filething)

    An AIFF audio file.

    Arguments:
        filething (filething)

    Attributes:
        tags (`mutagen.id3.ID3`)
        info (`AIFFInfo`)
    """

    _mimes = ["audio/aiff", "audio/x-aiff"]

    @staticmethod
    def score(filename, fileobj, header):
        filename = filename.lower()

        return (header.startswith(b"FORM") * 2 + endswith(filename, b".aif") +
                endswith(filename, b".aiff") + endswith(filename, b".aifc"))

    def add_tags(self):
        """Add an empty ID3 tag to the file."""
        if self.tags is None:
            self.tags = _IFFID3()
        else:
            raise error("an ID3 tag already exists")

    @convert_error(IOError, error)
    @loadfile()
    def load(self, filething, **kwargs):
        """Load stream and tag information from a file."""

        fileobj = filething.fileobj

        try:
            self.tags = _IFFID3(fileobj, **kwargs)
        except ID3NoHeaderError:
            self.tags = None
        except ID3Error as e:
            raise error(e)
        else:
            self.tags.filename = self.filename

        fileobj.seek(0, 0)
        self.info = AIFFInfo(fileobj)


Open = AIFF
