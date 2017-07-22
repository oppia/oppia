# -*- coding: utf-8 -*-
# Copyright (C) 2013  Christoph Reiter
#
# This program is free software; you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation; either version 2 of the License, or
# (at your option) any later version.

import sys


PY2 = sys.version_info[0] == 2
PY3 = not PY2

if PY2:
    from StringIO import StringIO
    BytesIO = StringIO
    from cStringIO import StringIO as cBytesIO
    from itertools import izip

    long_ = long
    integer_types = (int, long)
    string_types = (str, unicode)
    text_type = unicode

    xrange = xrange
    cmp = cmp
    chr_ = chr

    def endswith(text, end):
        return text.endswith(end)

    iteritems = lambda d: d.iteritems()
    itervalues = lambda d: d.itervalues()
    iterkeys = lambda d: d.iterkeys()

    iterbytes = lambda b: iter(b)

    exec("def reraise(tp, value, tb):\n raise tp, value, tb")

    def swap_to_string(cls):
        if "__str__" in cls.__dict__:
            cls.__unicode__ = cls.__str__

        if "__bytes__" in cls.__dict__:
            cls.__str__ = cls.__bytes__

        return cls

elif PY3:
    from io import StringIO
    StringIO = StringIO
    from io import BytesIO
    cBytesIO = BytesIO

    long_ = int
    integer_types = (int,)
    string_types = (str,)
    text_type = str

    izip = zip
    xrange = range
    cmp = lambda a, b: (a > b) - (a < b)
    chr_ = lambda x: bytes([x])

    def endswith(text, end):
        # usefull for paths which can be both, str and bytes
        if isinstance(text, str):
            if not isinstance(end, str):
                end = end.decode("ascii")
        else:
            if not isinstance(end, bytes):
                end = end.encode("ascii")
        return text.endswith(end)

    iteritems = lambda d: iter(d.items())
    itervalues = lambda d: iter(d.values())
    iterkeys = lambda d: iter(d.keys())

    iterbytes = lambda b: (bytes([v]) for v in b)

    def reraise(tp, value, tb):
        raise tp(value).with_traceback(tb)

    def swap_to_string(cls):
        return cls
