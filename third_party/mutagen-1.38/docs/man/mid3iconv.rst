===========
 mid3iconv
===========

-------------------------
convert ID3 tag encodings
-------------------------

:Manual section: 1


SYNOPSIS
========

**mid3iconv** [*options*] *filename* ...


DESCRIPTION
===========

**mid3iconv** converts ID3 tags from legacy encodings to Unicode and stores
them using the ID3v2 format.


OPTIONS
=======


--debug, -d
    Print updated tags

--dry-run, -p
    Do not actually modify files

--encoding, -e
    Convert from this encoding. By default, your locale's default encoding is
    used.

--force-v1
    Use an ID3v1 tag even if an ID3v2 tag is present

--quiet, -q
    Only output errors

--remove-v1
    Remove any ID3v1 tag after processing the files


AUTHOR
======

Emfox Zhou.

Based on id3iconv (http://www.cs.berkeley.edu/~zf/id3iconv/) by Feng Zhou.
