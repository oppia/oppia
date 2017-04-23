.. Bleach documentation master file, created by
   sphinx-quickstart on Fri May 11 21:11:39 2012.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Welcome to Bleach's documentation!
==================================

Bleach is a whitelist-based HTML sanitization and text linkification library.
It is designed to take untrusted user input with *some* HTML.

Because Bleach uses html5lib_ to parse document fragments the same way browsers
do, it is extremely resilient to unknown attacks, much more so than
regular-expression-based sanitizers.

Bleach's ``linkify`` function is highly configurable and can be used to find,
edit, and filter links most other auto-linkers can't.

The version of bleach on GitHub_ is the always the most up-to-date and the
``master`` branch should always work.

.. warn::

   Bleach is currently incompatible with html5lib 1.0b and any versions below
   0.9.5.


Installing Bleach
=================

Bleach is available on PyPI_, so you can install it with ``pip``::

    $ pip install bleach

Or with ``easy_install``::

    $ easy_install bleach

Or by cloning the repo from GitHub_::

    $ git clone git://github.com/jsocol/bleach.git

Then install it by running::

    $ python setup.py install


Contents:
=========

.. toctree::
   :maxdepth: 2

   clean
   linkify
   goals



Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`

.. _html5lib: http://code.google.com/p/html5lib/
.. _GitHub: https://github.com/jsocol/bleach
.. _PyPI: http://pypi.python.org/pypi/bleach
