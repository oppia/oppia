Command Line Tools
==================

.. toctree::
    :hidden:
    :titlesonly:

    mid3cp
    mid3iconv
    mid3v2
    moggsplit
    mutagen-inspect
    mutagen-pony


In addition to the Python library mutagen installs some command line tools:

:doc:`mid3cp`
    copies the ID3 tags from a source file to a destination file

:doc:`mid3iconv`
    converts ID3 tags from legacy encodings to Unicode and stores them using
    the ID3v2 format

:doc:`mid3v2`
    is a Mutagen-based replacement for id3lib’s id3v2

:doc:`moggsplit`
    splits a multiplexed Ogg stream into separate files

:doc:`mutagen-inspect`
    loads and prints information about an audio file and its tags

:doc:`mutagen-pony`
    scans any directories given and reports on the kinds of tags in the MP3s
    it finds in them
