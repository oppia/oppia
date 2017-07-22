.. image:: images/logo.svg
   :align: center
   :width: 400px

|

.. toctree::
    :hidden:
    :titlesonly:
    :maxdepth: 3

    changelog
    user/index
    api/index
    man/index
    contact

.. title:: Overview

.. include:: ../README.rst
    :start-after: |

----

There is a :doc:`brief tutorial with several API examples. 
<user/index>`


Installing
----------

::

    pip install mutagen

or

::

    sudo apt-get install python-mutagen python3-mutagen


Where do I get it?
------------------

Mutagen is hosted on `GitHub <https://github.com/quodlibet/mutagen>`_. The
`download page <https://github.com/quodlibet/mutagen/releases>`_ or `PyPI
<https://pypi.org/project/mutagen>`_ will have the latest version or check out
the git repository::

    $ git clone https://github.com/quodlibet/mutagen.git


Why Mutagen?
------------

Quod Libet has more strenuous requirements in a tagging library than most
programs that deal with tags. Therefore we felt it was necessary to write our
own.

* Mutagen has a simple API, that is roughly the same across all tag formats
  and versions and integrates into Python's builtin types and interfaces.
* New frame types and file formats are easily added, and the behavior of the
  current formats can be changed by extending them.
* Freeform keys, multiple values, Unicode, and other advanced features were
  considered from the start and are fully supported.
* All ID3v2 versions and all ID3v2.4 frames are covered, including rare ones
  like POPM or RVA2.
* We take automated testing very seriously. All bug fixes are commited with a
  test that prevents them from recurring, and new features are committed with
  a full test suite. 


Real World Use
--------------

Mutagen can load nearly every MP3 we have thrown at it (when it hasn't, we 
make it do so). Scripts are included so you can run the same tests on your 
collection.

The following software projects are using Mutagen for tagging:

* `Ex Falso and Quod Libet <https://quodlibet.readthedocs.org>`_, a flexible tagger and player
* `Beets <http://beets.radbox.org/>`_, a music library manager and MusicBrainz tagger
* `Picard <https://picard.musicbrainz.org/>`_, cross-platform MusicBrainz tagger
* `Puddletag <http://puddletag.net/>`_, an audio tag editor
* `Exaile <http://www.exaile.org/>`_, a media player aiming to be similar to KDE's AmaroK, but for GTK+
