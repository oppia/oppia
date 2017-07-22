===========
 moggsplit
===========

-------------------------
split Ogg logical streams
-------------------------

:Manual section: 1


SYNOPSIS
========

**moggsplit** *filename* ...


DESCRIPTION
===========

**moggsplit** splits a multiplexed Ogg stream into separate files. For
example, it can separate an OGM into separate Ogg DivX and Ogg Vorbis
streams, or a chained Ogg Vorbis file into two separate files.


OPTIONS
=======

--extension
    Use the supplied extension when generating new files; the default is
    **ogg**.

--pattern
    Use the supplied pattern when generating new files. This is a Python
    keyword format string with three variables, *base* for the original
    file's base name, *stream* for the stream's serial number, and ext for
    the extension give by **--extension**.

    The default is ``%(base)s-%(stream)d.%(ext)s``.

--m3u
    Generate an m3u playlist along with the newly generated files. Useful
    for large chained Oggs.


AUTHOR
======

Joe Wreschnig
