Main Module
-----------

.. automodule:: mutagen
    :members: File, version, version_string


Base Classes
~~~~~~~~~~~~

.. autoclass:: mutagen.FileType
    :members: pprint, add_tags, mime, save, delete
    :show-inheritance:


.. autoclass:: mutagen.Tags
    :members: pprint


.. autoclass:: mutagen.Metadata
    :show-inheritance:
    :members: save, delete


.. autoclass:: mutagen.StreamInfo
    :members: pprint


.. autoclass:: mutagen.PaddingInfo
    :members:


.. autoclass:: mutagen.MutagenError


Internal Classes
~~~~~~~~~~~~~~~~

.. automodule:: mutagen._util

.. autoclass:: mutagen._util.DictMixin

.. autoclass:: mutagen._util.DictProxy
    :show-inheritance:


Other Classes and Functions
~~~~~~~~~~~~~~~~~~~~~~~~~~~

.. currentmodule:: mutagen

.. class:: text()

    This type only exists for documentation purposes. It represents
    :obj:`unicode` under Python 2 and :obj:`str` under Python 3.


.. class:: bytes()

    This type only exists for documentation purposes. It represents
    :obj:`python:str` under Python 2 and :obj:`python3:bytes` under Python 3.


.. class:: fspath()

    This type only exists for documentation purposes. It represents a file
    name which can be :obj:`python:str` or :obj:`python:unicode` under Python
    2 and :obj:`python3:bytes` or :obj:`python3:str` under Python 3.

.. class:: fileobj()

    This type only exists for documentation purposes. A file-like object.
     See :doc:`/user/filelike` for more information.

.. class:: filething()

    This type only exists for documentation purposes. Either a `fspath` or
    a `fileobj`.


.. function:: PaddingFunction(info)

    A function you can implement and pass to various ``save()`` methods for
    controlling the amount of padding to use. See :doc:`/user/padding` for
    more information.

    :param PaddingInfo info:
    :returns: The amount of padding to use
    :rtype: int
