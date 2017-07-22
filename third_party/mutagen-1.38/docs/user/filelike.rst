==============================
Working with File-like Objects
==============================

.. currentmodule:: mutagen

The first argument passed to a :class:`FileType` or :class:`Metadata` can
either be a file name or a file-like object, such as `StringIO
<StringIO.StringIO>`  (`BytesIO <io.BytesIO>` in Python 3) and mutagen will
figure out what to do.

::

    MP3("myfile.mp3")
    MP3(myfileobj)


If for some reason the automatic type detection fails, it's possible to pass
them using a named argument which skips the type guessing.

::

    MP3(filename="myfile.mp3")
    MP3(fileobj=myfileobj)


Mutagen expects the file offset to be at 0 for all file objects passed to it.

The file-like object has to implement the following interface (It's a limited
subset of real file objects and StringIO/BytesIO)

.. literalinclude:: examples/fileobj-iface.py


Gio Example Implementation
--------------------------

The following implements a file-like object using `PyGObject
<https://wiki.gnome.org/PyGObject>`__ and `Gio
<https://developer.gnome.org/gio/stable/ch01.html>`__. It can be
:download:`downloaded here <examples/fileobj-gio.py>`.

.. literalinclude:: examples/fileobj-gio.py
