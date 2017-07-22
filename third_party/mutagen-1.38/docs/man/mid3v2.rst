=========
 mid3v2
=========

-----------------------------------
audio tag editor similar to 'id3v2'
-----------------------------------

:Manual section: 1


SYNOPSIS
========

**mid3v2** [*options*] *filename* ...


DESCRIPTION
===========

**mid3v2** is a Mutagen-based replacement for id3lib's id3v2. It supports 
ID3v2.4 and more frames; it also does not have the numerous bugs that plague 
id3v2.

This program exists mostly for compatibility with programs that want to tag 
files using id3v2. For a more usable interface, we recommend Ex Falso.


OPTIONS
=======

-q, --quiet
    Be quiet: do not mention file operations that perform the user's
    request. Warnings will still be printed.

-v, --verbose
    Be verbose: state all operations performed. This is the opposite of
    --quiet. This is the default.

-e, --escape
    Enable interpretation of backslash escapes for tag values.
    Makes it possible to escape the colon-separator in TXXX, COMM
    values like '\\:' and insert escape sequences like '\\n', '\\t' etc.

-f, --list-frames
    Display all supported ID3v2.3/2.4 frames and their meanings.

-L, --list-genres
    List all ID3v1 numeric genres. These can be used to set TCON frames,
    but it is not recommended.

-l, --list
    List all tags in the files. The output format is *not* the same as 
    id3v2's; instead, it is easily parsable and readable. Some tags may not 
    have human-readable representations.

--list-raw
    List all tags in the files, in raw format. Although this format is
    nominally human-readable, it may be very long if the tag contains
    embedded binary data.

-d, --delete-v2
    Delete ID3v2 tags.

-s, --delete-v1
    Delete ID3v1 tags.

-D, --delete-all
    Delete all ID3 tags.

--delete-frames=FRAMES
    Delete specific ID3v2 frames (or groups of frames) from the files. 
    ``FRAMES`` is a "," separated list of frame names e.g. ``"TPE1,TALB"``

-C, --convert
    Convert ID3v1 tags to ID3v2 tags. This  will also happen automatically
    during any editing.

-a, --artist=ARTIST
    Set the artist information (TPE1).

-A, --album=ALBUM
    Set the album information (TALB).

-t, --song=TITLE
    Set the title information (TIT2).

-c, --comment=<DESCRIPTION:COMMENT:LANGUAGE>
    Set a comment (COMM). The language and description may be omitted, in
    which case the language defaults to English, and the description to an
    empty string.

-p, --picture=<FILENAME:DESCRIPTION:IMAGE-TYPE:MIME-TYPE>
    Set the attached picture (APIC). Everything except the filename can be
    omitted in which case default values will be used.

-g, --genre=GENRE
    Set the genre information (TCON).

-y, --year=<YYYY>, --date=<YYYY-[MM-DD]>
    Set the year/date information (TDRC).

-T, --track=<NUM/NUM>
    Set the track number (TRCK).

Any text or URL frame (those beginning with T or W) can be modified or
added by prefixing the name of the frame with "--". For example, ``--TIT3
"Monkey!"`` will set the TIT3 (subtitle) frame to ``Monkey!``.

The TXXX frame requires a colon-separated description key; many TXXX frames
may be set in the file as long as they have different keys. To set this
key, just separate the text with a colon, e.g. ``--TXXX
"ALBUMARTISTSORT:Examples, The"``.

The special POPM frame can be set in a similar way: ``--POPM
"bob@example.com:128:2"`` to set Bob's rating to 128/255 with 2 plays.


BUGS
====

No sanity checking is done on the editing operations you perform, so mid3v2
will happily accept --TSIZ when editing an ID3v2.4 frame. However, it will
also automatically throw it out during the next edit operation.


AUTHOR
======

Joe Wreschnig is the author of mid3v2, but he doesn't like to admit it.
