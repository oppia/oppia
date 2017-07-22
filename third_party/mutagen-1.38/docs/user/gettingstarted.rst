===============
Getting Started
===============

.. currentmodule:: mutagen

The `File` functions takes any audio file, guesses its type and returns a
`FileType` instance or `None`.

::

    >>> import mutagen
    >>> mutagen.File("11. The Way It Is.ogg")
    {'album': [u'Always Outnumbered, Never Outgunned'],
     'title': [u'The Way It Is'], 'artist': [u'The Prodigy'],
     'tracktotal': [u'12'], 'albumartist': [u'The Prodigy'],'date': [u'2004'],
     'tracknumber': [u'11'],
    >>> _.info.pprint()
    u'Ogg Vorbis, 346.43 seconds, 499821 bps'
    >>> 

The following code loads a FLAC file, sets its title, prints all tag data,
then saves the file.

::

    from mutagen.flac import FLAC

    audio = FLAC("example.flac")
    audio["title"] = u"An example"
    audio.pprint()
    audio.save()


The following example gets the length and bitrate of an MP3 file

::

    from mutagen.mp3 import MP3

    audio = MP3("example.mp3")
    print(audio.info.length)
    print(audio.info.bitrate)


The following deletes an ID3 tag from an MP3 file

::

    from mutagen.id3 import ID3

    audio = ID3("example.mp3")
    audio.delete()


Here we parse a Vorbis file as FLAC, which leads to an `MutagenError` being
raised.


::

    >>> import mutagen.flac
    >>> mutagen.flac.FLAC("11. The Way It Is.ogg")
    Traceback (most recent call last):
      File "<stdin>", line 1, in <module>
      File "/usr/lib/python2.7/dist-packages/mutagen/_file.py", line 42, in __init__
        self.load(filename, *args, **kwargs)
      File "/usr/lib/python2.7/dist-packages/mutagen/flac.py", line 759, in load
        self.__check_header(fileobj)
      File "/usr/lib/python2.7/dist-packages/mutagen/flac.py", line 867, in __check_header
        "%r is not a valid FLAC file" % fileobj.name)
    mutagen.flac.FLACNoHeaderError: '11. The Way It Is.ogg' is not a valid FLAC file


Unicode
^^^^^^^

Mutagen has full Unicode support for all formats. When you assign text
strings, we strongly recommend using Python unicode objects rather
than str objects. If you use str objects, Mutagen will assume they are
in UTF-8 (This does not apply to filenames)


Multiple Values
^^^^^^^^^^^^^^^

Most tag formats support multiple values for each key, so when you
access then (e.g. ``audio["title"]``) you will get a list of strings
rather than a single one (``[u"An example"]`` rather than ``u"An example"``).
Similarly, you can assign a list of strings rather than a single one.
