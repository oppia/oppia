#!/usr/bin/python
# -*- coding: utf-8 -*-
# Copyright 2013 Christoph Reiter
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.

"""
./id3_frames_gen.py > api/id3_frames.rst
"""

import sys
import os

sys.path.insert(0, os.path.abspath('../'))

import mutagen.id3
from mutagen.id3 import Frames, Frames_2_2, Frame


BaseFrames = dict([(k, v) for (k, v) in vars(mutagen.id3).items()
                   if v not in Frames.values() and v not in Frames_2_2.values()
                   and isinstance(v, type) and
                   (issubclass(v, Frame) or v is Frame)])


def print_header(header, type_="-"):
    print(header)
    print(type_ * len(header))
    print("")


def print_frames(frames, sort_mro=False):
    if sort_mro:
        # less bases first, then by name
        sort_func = lambda x: (len(x[1].__mro__), x[0])
    else:
        sort_func = lambda x: x

    for name, cls in sorted(frames.items(), key=sort_func):
        print("""
.. autoclass:: mutagen.id3.%s
    :show-inheritance:
    :members:
""" % repr(cls()))


if __name__ == "__main__":

    print_header("Frame Base Classes")
    print_frames(BaseFrames, sort_mro=True)
    print_header("ID3v2.3/4 Frames")
    print_frames(Frames)
