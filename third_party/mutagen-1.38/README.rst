.. image:: https://cdn.rawgit.com/quodlibet/mutagen/master/docs/images/logo.svg
   :align: center
   :width: 400px

|

Mutagen is a Python module to handle audio metadata. It supports ASF, FLAC,
MP4, Monkey's Audio, MP3, Musepack, Ogg Opus, Ogg FLAC, Ogg Speex, Ogg Theora,
Ogg Vorbis, True Audio, WavPack, OptimFROG, and AIFF audio files. All
versions of ID3v2 are supported, and all standard ID3v2.4 frames are parsed.
It can read Xing headers to accurately calculate the bitrate and length of
MP3s. ID3 and APEv2 tags can be edited regardless of audio format. It can also
manipulate Ogg streams on an individual packet/page level.

Mutagen works with Python 2.7, 3.3+ (CPython and PyPy) on Linux, Windows and
macOS, and has no dependencies outside the Python standard library. Mutagen
is licensed under the GPL version 2 or later.

For more information visit https://mutagen.readthedocs.org

.. image:: https://travis-ci.org/quodlibet/mutagen.svg?branch=master
    :target: https://travis-ci.org/quodlibet/mutagen
