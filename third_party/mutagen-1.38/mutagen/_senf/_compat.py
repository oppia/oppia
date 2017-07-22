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


PY2 = sys.version_info[0] == 2
PY3 = not PY2


if PY2:
    from urlparse import urlparse, urlunparse
    urlparse, urlunparse
    from urllib import pathname2url, url2pathname, quote, unquote
    pathname2url, url2pathname, quote, unquote

    from StringIO import StringIO
    BytesIO = StringIO
    from io import StringIO as TextIO
    TextIO

    string_types = (str, unicode)
    text_type = unicode

    iteritems = lambda d: d.iteritems()
elif PY3:
    from urllib.parse import urlparse, quote, unquote, urlunparse
    urlparse, quote, unquote, urlunparse
    from urllib.request import pathname2url, url2pathname
    pathname2url, url2pathname

    from io import StringIO
    StringIO = StringIO
    TextIO = StringIO
    from io import BytesIO
    BytesIO = BytesIO

    string_types = (str,)
    text_type = str

    iteritems = lambda d: iter(d.items())
