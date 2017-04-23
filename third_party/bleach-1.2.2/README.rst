======
Bleach
======

Bleach is an HTML sanitizing library that escapes or strips markup and
attributes based on a white list. Bleach can also linkify text safely, applying
filters that Django's ``urlize`` filter cannot, and optionally setting ``rel``
attributes, even on links already in the text.

Bleach is intended for sanitizing text from *untrusted* sources. If you find
yourself jumping through hoops to allow your site administrators to do lots of
things, you're probably outside the use cases. Either trust those users, or
don't.

Because it relies on html5lib_, Bleach is as good as modern browsers at dealing
with weird, quirky HTML fragments. And *any* of Bleach's methods will fix
unbalanced or mis-nested tags.

The version on GitHub_ is the most up-to-date and contains the latest bug
fixes. You can find full documentation on `ReadTheDocs`_.


Basic Use
=========

The simplest way to use Bleach is::

    >>> import bleach

    >>> bleach.clean('an <script>evil()</script> example')
    u'an &lt;script&gt;evil()&lt;/script&gt; example'

    >>> bleach.linkify('an http://example.com url')
    u'an <a href="http://example.com" rel="nofollow">http://example.com</a> url

*NB*: Bleach always returns a ``unicode`` object, whether you give it a
bytestring or a ``unicode`` object, but Bleach does not attempt to detect
incoming character encodings, and will assume UTF-8. If you are using a
different character encoding, you should convert from a bytestring to
``unicode`` before passing the text to Bleach.


Installation
------------

Bleach is available on PyPI_, so you can install it with ``pip``::

    $ pip install bleach

Or with ``easy_install``::

    $ easy_install bleach

Or by cloning the repo from GitHub_::

    $ git clone git://github.com/jsocol/bleach.git

Then install it by running::

    $ python setup.py install


.. _html5lib: http://code.google.com/p/html5lib/
.. _GitHub: https://github.com/jsocol/bleach
.. _ReadTheDocs: http://bleach.readthedocs.org/
.. _PyPI: http://pypi.python.org/pypi/bleach
