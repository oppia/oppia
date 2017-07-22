#!/usr/bin/env python
# -*- coding: utf-8 -*-
# Copyright 2016 Christoph Reiter
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.


import mutagen
from gi.repository import Gio, GLib


def reraise(func):
    def wrap(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        except GLib.Error as e:
            raise IOError(e.message)
    return wrap


class DummyOutput(object):

    def __getattr__(self, name):
        raise IOError("Read only")


class GioMutagenFile(object):

    @reraise
    def __init__(self, file_, writable, cancellable):
        self._file = file_
        self._cancellable = cancellable
        if writable:
            self._iostream = self._file.open_readwrite(cancellable)
            self._istream = self._iostream.get_input_stream()
            self._ostream = self._iostream.get_output_stream()
        else:
            self._iostream = self._file.read(cancellable)
            self._istream = self._iostream
            self._ostream = DummyOutput()

    def __enter__(self, *args, **kwargs):
        return self

    def __exit__(self, *args, **kwargs):
        self.close()

    @classmethod
    def open(cls, file_, writable=False, cancellable=None):
        return cls(file_, writable, cancellable)

    @reraise
    def close(self):
        self._iostream.close(self._cancellable)
        self._istream.close(self._cancellable)
        if not isinstance(self._ostream, DummyOutput):
            self._ostream.close(self._cancellable)
        del self._iostream
        del self._istream
        del self._ostream

    @reraise
    def tell(self):
        return self._iostream.tell()

    @reraise
    def read(self, size=-1):
        buffer_ = bytearray()
        if size == -1:
            data = True
            while data:
                data = self._istream.read_bytes(
                    4096, self._cancellable).get_data()
                buffer_.extend(data)
        elif size > 0:
            data = True
            while len(buffer_) < size and data:
                data = self._istream.read_bytes(
                    size - len(buffer_), self._cancellable).get_data()
                buffer_.extend(data)
        return bytes(buffer_)

    @reraise
    def seek(self, offset, whence=0):
        whence = {1: 0, 0: 1, 2: 2}[whence]
        self._iostream.seek(offset, whence, self._cancellable)

    @property
    def name(self):
        try:
            file_info = self._file.query_info(
                Gio.FILE_ATTRIBUTE_STANDARD_DISPLAY_NAME,
                Gio.FileQueryInfoFlags.NONE,
                self._cancellable)
        except GLib.Error:
            return ""
        else:
            return file_info.get_display_name()

    @reraise
    def write(self, data):
        self._ostream.write_all(data, self._cancellable)

    @reraise
    def truncate(self, size=None):
        if size is None:
            size = self.tell()
        self._iostream.truncate(size, self._cancellable)

    @reraise
    def flush(self):
        self._ostream.flush(self._cancellable)

    def fileno(self):
        try:
            return self._ostream.get_fd()
        except AttributeError:
            raise IOError("No fileno available")


if __name__ == "__main__":
    gio_file = Gio.File.new_for_uri(
        "http://people.xiph.org/~giles/2012/opus/ehren-paper_lights-96.opus")

    cancellable = Gio.Cancellable.new()
    with GioMutagenFile.open(gio_file, writable=False,
                             cancellable=cancellable) as mutagen_file:
        print(mutagen.File(mutagen_file).pprint())
