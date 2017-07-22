==============
Vorbis Comment
==============

VorbisComment is the tagging format used in Ogg and FLAC container formats. In
mutagen this corresponds to the tags in all subclasses of
:class:`mutagen.ogg.OggFileType` and the :class:`mutagen.flac.FLAC` class.

Embedded Images
~~~~~~~~~~~~~~~

The most common way to include images in VorbisComment (except in FLAC) is to
store a base64 encoded FLAC Picture block with the key
``metadata_block_picture`` (see
https://wiki.xiph.org/VorbisComment#Cover_art). See the following code example
on how to read and write images this way::

    # READING / SAVING
    import base64
    from mutagen.oggvorbis import OggVorbis
    from mutagen.flac import Picture, error as FLACError

    file_ = OggVorbis("somefile.ogg")

    for b64_data in file_.get("metadata_block_picture", []):
        try:
            data = base64.b64decode(b64_data)
        except (TypeError, ValueError):
            continue

        try:
            picture = Picture(data)
        except FLACError:
            continue

        extensions = {
            "image/jpeg": "jpg",
            "image/png": "png",
            "image/gif": "gif",
        }
        ext = extensions.get(picture.mime, "jpg")

        with open("image.%s" % ext, "wb") as h:
            h.write(picture.data)

::

    # WRITING
    import base64
    from mutagen.oggvorbis import OggVorbis
    from mutagen.flac import Picture

    file_ = OggVorbis("somefile.ogg")

    with open("image.jpeg", "rb") as h:
        data = h.read()

    picture = Picture()
    picture.data = data
    picture.type = 17
    picture.desc = u"A bright coloured fish"
    picture.mime = u"image/jpeg"
    picture.width = 100
    picture.height = 100
    picture.depth = 24

    picture_data = picture.write()
    encoded_data = base64.b64encode(picture_data)
    vcomment_value = encoded_data.decode("ascii")

    file_["metadata_block_picture"] = [vcomment_value]
    file_.save()


Some programs also write base64 encoded image data directly into the
``coverart`` field and sometimes a corresponding mime type into the
``coverartmime`` field::

    # READING
    import base64
    import itertools
    from mutagen.oggvorbis import OggVorbis

    file_ = OggVorbis("somefile.ogg")

    values = file_.get("coverart", [])
    mimes = file_.get("coverartmime", [])
    for value, mime in itertools.izip_longest(values, mimes, fillvalue=u""):
        try:
            image_data = base64.b64decode(value.encode("ascii"))
        except (TypeError, ValueError):
            continue

        print(mime)
        print(image_data)


FLAC supports images directly, see :class:`mutagen.flac.Picture`,
:attr:`mutagen.flac.FLAC.pictures`, :meth:`mutagen.flac.FLAC.add_picture` and
:meth:`mutagen.flac.FLAC.clear_pictures`.
