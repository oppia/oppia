==============
Class Overview
==============

.. currentmodule:: mutagen

The main notable classes in mutagen are :class:`FileType`,
:class:`StreamInfo`, :class:`Tags`, :class:`Metadata` and for error handling
the :class:`MutagenError` exception.

FileType
--------

A :class:`FileType` is used to represent container formats which contain
audio/video and tags. In some cases, like MP4, the tagging format and the
container are inseparable, while in other cases, like MP3, the container does
not know about tags and the metadata is loosely attached to the file.

A :class:`FileType` always represents only one combination of an audio stream
(StreamInfo) and tags (Tags). In case there are multiple audio streams in one
file, mutagen exposes the primary/first one. In case tags are associated with
the audio/video stream the FileType represents the stream and its tags. Given
a file containing Ogg Theora video with Vorbis audio, depending on whether you
use :class:`oggvorbis.OggVorbis` or :class:`oggtheora.OggTheora` for parsing,
you get the respective tags and stream info associated with either the vorbis
or the theora stream.

It provides a dict-like interface which acts as a proxy to the containing
`Tags` instance.

::

    >>> from mutagen.oggvorbis import OggVorbis
    >>> f = OggVorbis("11. The Way It Is.ogg")
    >>> type(f)
    <class 'mutagen.oggvorbis.OggVorbis'>
    >>>


Tags
----

Each FileType has a attributes tags which holds a :class:`Tags` instance. The
Tags interface depends mostly on each format. It exposes a dict-like interface
where the type of keys and values depends on the implementation of each
format.

::

    >>> type(f.tags)
    <class 'mutagen.oggvorbis.OggVCommentDict'>
    >>>


StreamInfo
----------

Similar to Tags, a FileType also holds a :class:`StreamInfo` instance. It
represents one audio/video stream and contains its length, codec information,
number of channels, etc.

::

    >>> type(f.info)
    <class 'mutagen.oggvorbis.OggVorbisInfo'>
    >>> print(f.info.pprint())
    Ogg Vorbis, 346.43 seconds, 499821 bps
    >>>


Metadata
--------

`Metadata` is a mixture between `FileType` and `Tags` and is used for
tagging formats which are not depending on a container format. They can be
attached to any file. This includes ID3 and APEv2.

::

    >>> from mutagen.id3 import ID3
    >>> m = ID3("08. Firestarter.mp3")
    >>> type(m)
    <class 'mutagen.id3.ID3'>
    >>> 


MutagenError
------------

The :class:`MutagenError` exception is the base class for all custom
exceptions in mutagen.


::

    from mutagen import MutagenError

    try:
        f = OggVorbis("11. The Way It Is.ogg")
    except MutagenError:
        print("Loading failed :(")
