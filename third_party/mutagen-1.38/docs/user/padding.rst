===========
Tag Padding
===========

.. currentmodule:: mutagen

Many formats mutagen supports include a notion of metadata padding, empty
space in the file following the metadata. In case the size of the metadata
increases, this empty space can be claimed and written into. The alternative
would be to resize the whole file, which means everything after the metadata
needs to be rewritten. This can be a time consuming operation if the file is
large and should be avoided.

For formats where mutagen supports using such a padding it will use the
existing padding for extending metadata, add additional padding if the added
data exceeds the size of the existing padding and reduce the padding size if
it makes up more than a significant part of the file size.

It also provides additional API to control the padding usage. Some `FileType`
and `Metadata` subclasses provide a ``save()`` method which can be passed a
``padding`` callback. This callback gets called with a `PaddingInfo` instance
and should return the amount of padding to write to the file.

::

    from mutagen.mp3 import MP3

    def no_padding(info):
        # this will remove all padding
        return 0

    def default_implementation(info):
        # this is the default implementation, which can be extended
        return info.get_default_padding()

    def no_new_padding(info):
        # this will use existing padding but never add new one
        return max(info.padding, 0)

    f = MP3("somefile.mp3")
    f.save(padding=no_padding)
    f.save(padding=default_implementation)
    f.save(padding=no_new_padding)
