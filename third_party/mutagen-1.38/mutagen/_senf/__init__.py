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

if os.name != "nt":
    # make imports work
    _winapi = object()

from ._fsnative import fsnative, path2fsn, fsn2text, fsn2bytes, \
    bytes2fsn, uri2fsn, fsn2uri, text2fsn
from ._print import print_, input_
from ._stdlib import sep, pathsep, curdir, pardir, altsep, extsep, devnull, \
    defpath, getcwd, expanduser, expandvars
from ._argv import argv
from ._environ import environ, getenv, unsetenv, putenv
from ._temp import mkstemp, gettempdir, gettempprefix, mkdtemp


fsnative, print_, getcwd, getenv, unsetenv, putenv, environ, expandvars, \
    path2fsn, fsn2text, fsn2bytes, bytes2fsn, uri2fsn, fsn2uri, mkstemp, \
    gettempdir, gettempprefix, mkdtemp, input_, expanduser, text2fsn


version = (1, 2, 2)
"""Tuple[`int`, `int`, `int`]: The version tuple (major, minor, micro)"""


version_string = ".".join(map(str, version))
"""`str`: A version string"""


argv = argv
"""List[`fsnative`]: Like `sys.argv` but contains unicode under
Windows + Python 2
"""


sep = sep
"""`fsnative`: Like `os.sep` but a `fsnative`"""


pathsep = pathsep
"""`fsnative`: Like `os.pathsep` but a `fsnative`"""


curdir = curdir
"""`fsnative`: Like `os.curdir` but a `fsnative`"""


pardir = pardir
"""`fsnative`: Like `os.pardir` but a fsnative"""


altsep = altsep
"""`fsnative` or `None`: Like `os.altsep` but a `fsnative` or `None`"""


extsep = extsep
"""`fsnative`: Like `os.extsep` but a `fsnative`"""


devnull = devnull
"""`fsnative`: Like `os.devnull` but a `fsnative`"""


defpath = defpath
"""`fsnative`: Like `os.defpath` but a `fsnative`"""


__all__ = []
