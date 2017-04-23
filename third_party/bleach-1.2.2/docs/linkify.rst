.. _linkify-chapter:
.. highlightlang:: python

====================
``bleach.linkify()``
====================

``linkify()`` searches text for links, URLs, and email addresses and lets you
control how and when those links are rendered::

    def linkify(text, callbacks=DEFAULT_CALLBACKS, skip_pre=False,
                parse_email=False, tokenizer=HTMLSanitizer):
        """Convert URL-like strings in an HTML fragment to links.

``linkify()`` works by building a document tree, so it's guaranteed never to do
weird things to URLs in attribute values, can modify the value of attributes on
``<a>`` tags, and can even do things like skip ``<pre>`` sections.

By default, ``linkify()`` will perform some sanitization, only allowing a set
of "safe" tags. Because it uses the HTML5 parsing algorithm, it will always
handle things like unclosed tags.

.. note::
   You may pass a ``string`` or ``unicode`` object, but Bleach will always
   return ``unicode``.


Callbacks
=========

The second argument to ``linkify()`` is a list or other iterable of callback
functions. These callbacks can modify links that exist and links that are being
created, or remove them completely.

Each callback will get the following arguments::

    def my_callback(attrs, new=False):

The ``attrs`` argument is a dict of attributes of the ``<a>`` tag. The ``new``
argument is a boolean indicating if the link is new (e.g. an email address or
URL found in the text) or already existed (e.g. an ``<a>`` tag found in the
text). The ``attrs`` dict also contains a ``_text`` key, which is the innerText
of the ``<a>`` tag.

The callback must return a dict of attributes (including ``_text``) or
``None``. The new dict of attributes will be passed to the next callback in the
list. If any callback returns ``None``, the link will not be created and the
original text left in place, or will be removed, and its original innerText
left in place.

The default value is simply to add ``rel="nofollow"``. See ``bleach.callbacks``
for some included callback functions.


Setting Attributes
------------------

For example, to set ``rel="nofollow"`` on all links found in the text, a simple
(and included) callback might be::

    def set_nofollow(attrs, new=False):
        attrs['rel'] = 'nofollow'
        return attrs

This would overwrite the value of the ``rel`` attribute if it was set.

You could also make external links open in a new tab, or set a class::

    from urlparse import urlparse

    def set_target(attrs, new=False):
        p = urlparse(attrs['href'])
        if p.netloc not in ['my-domain.com', 'other-domain.com']:
            attrs['target'] = '_blank'
            attrs['class'] = 'external'
        else:
            attrs.pop('target', None)
        return attrs


Removing Attributes
-------------------

You can easily remove attributes you don't want to allow, even on existing
links (``<a>`` tags) in the text. (See also :ref:`clean() <clean-chapter>` for
sanitizing attributes.)

::

    def allowed_attributes(attrs, new=False):
        """Only allow href, target, rel and title."""
        allowed = ['href', 'target', 'rel', 'title']
        return dict((k, v) for k, v in attrs.items() if k in allowed)

Or you could remove a specific attribute, if it exists::

    def remove_title1(attrs, new=False):
        attrs.pop('title', None)
        return attrs

    def remove_title2(attrs, new=False):
        if 'title' in attrs:
            del attrs['title']
        return attrs


Altering Attributes
-------------------

You can alter and overwrite attributes, including the link text, via the
``_text`` key, to, for example, pass outgoing links through a warning page, or
limit the length of text inside an ``<a>`` tag.

::

    def shorten_url(attrs, new=False):
        """Shorten overly-long URLs in the text."""
        if not new:  # Only looking at newly-created links.
            return attrs
        # _text will be the same as the URL for new links.
        text = attrs['_text']
        if len(text) > 25:
            attrs['_text'] = text[0:22] + '...'
        return attrs

::

    from urllib2 import quote
    from urlparse import urlparse

    def outgoing_bouncer(attrs, new=False):
        """Send outgoing links through a bouncer."""
        p = urlparse(attrs['href'])
        if p.netloc not in ['my-domain.com', 'www.my-domain.com', '']:
            bouncer = 'http://outgoing.my-domain.com/?destination=%s'
            attrs['href'] = bouncer % quote(attrs['href'])
        return attrs


Preventing Links
----------------

A slightly more complex example is inspired by Crate_, where strings like
``models.py`` are often found, and linkified. ``.py`` is the ccTLD for
Paraguay, so ``example.py`` may be a legitimate URL, but in the case of a site
dedicated to Python packages, odds are it is not. In this case, Crate_ could
write the following callback::

    def dont_linkify_python(attrs, new=False):
        if not new:  # This is an existing <a> tag, leave it be.
            return attrs

        # If the TLD is '.py', make sure it starts with http: or https:
        href = attrs['href']
        if href.endswith('.py') and not href.startswith(('http:', 'https:')):
            # This looks like a Python file, not a URL. Don't make a link.
            return None

        # Everything checks out, keep going to the next callback.
        return attrs


Removing Links
--------------

If you want to remove certain links, even if they are written in the text with
``<a>`` tags, you can still return ``None``::

    def remove_mailto(attrs, new=False):
        """Remove any mailto: links."""
        if attrs['href'].startswith('mailto:'):
            return None
        return attrs


``skip_pre``
============

``<pre>`` tags are often special, literal sections. If you don't want to create
any new links within a ``<pre>`` section, pass ``skip_pre=True``.

.. note::
   Though new links will not be created, existing links created with ``<a>``
   tags will still be passed through all the callbacks.


``parse_email``
===============

By default, ``linkify()`` does not create ``mailto:`` links for email
addresses, but if you pass ``parse_email=True``, it will. ``mailto:`` links
will go through exactly the same set of callbacks as all other links, whether
they are newly created or already in the text, so be careful when writing
callbacks that may need to behave differently if the protocol is ``mailto:``.


``tokenizer``
============

``linkify()`` uses the ``html5lib.sanitizer.HTMLSanitizer`` tokenizer by
default. This has the effect of scrubbing some tags and attributes. To use a
more lenient, or totally different, tokenizer, you can specify the tokenizer
class here. (See the implementation of :ref:`clean() <clean-chapter>` for an
example of building a custom tokenizer.)

::

    from html5lib.tokenizer import HTMLTokenizer
    linked_text = linkify(text, tokenizer=HTMLTokenizer)


.. _Crate: https://crate.io/
