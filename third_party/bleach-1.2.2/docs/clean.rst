.. _clean-chapter:
.. highlightlang:: python

==================
``bleach.clean()``
==================

``clean()`` is Bleach's HTML sanitization method::

    def clean(text, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES,
              styles=ALLOWED_STYLES, strip=False, strip_comments=True):
        """Clean an HTML fragment and return it."""

Given a fragment of HTML, Bleach will parse it according to the HTML5 parsing
algorithm and sanitize any disallowed tags or attributes. This algorithm also
takes care of things like unclosed and (some) misnested tags.

.. note::
   You may pass in a ``string`` or a ``unicode`` object, but Bleach will
   always return ``unicode``.


Tag Whitelist
=============

The ``tags`` kwarg is a whitelist of allowed HTML tags. It should be a list,
tuple, or other iterable. Any other HTML tags will be escaped or stripped from
the text.  Its default value is a relatively conservative list found in
``bleach.ALLOWED_TAGS``.


Attribute Whitelist
===================

The ``attributes`` kwarg is a whitelist of attributes. It can be a list, in
which case the attributes are allowed for any tag, or a dictionary, in which
case the keys are tag names (or a wildcard: ``*`` for all tags) and the values
are lists of allowed attributes.

For example::

    attrs = {
        '*': ['class'],
        'a': ['href', 'rel'],
        'img': ['src', 'alt'],
    }

In this case, ``class`` is allowed on any allowed element (from the ``tags``
argument), ``<a>`` tags are allowed to have ``href`` and ``rel`` attributes,
and so on.

The default value is also a conservative dict found in
``bleach.ALLOWED_ATTRIBUTES``.


Callable Filters
----------------

You can also use a callable (instead of a list) in the ``attributes`` kwarg. If
the callable returns ``True``, the attribute is allowed. Otherwise, it is
stripped. For example::

    def filter_src(name, value):
        if name in ('alt', 'height', 'width'):
            return True
        if name == 'src':
            p = urlparse(value)
            return (not p.netloc) or p.netloc == 'mydomain.com'
        return False

    attrs = {
        'img': filter_src,
    }


Styles Whitelist
================

If you allow the ``style`` attribute, you will also need to whitelist styles
users are allowed to set, for example ``color`` and ``background-color``.

The default value is an empty list, i.e., the ``style`` attribute will be
allowed but no values will be.

For example, to allow users to set the color and font-weight of text::

    attrs = {
        '*': 'style'
    }
    tags = ['p', 'em', 'strong']
    styles = ['color', 'font-weight']
    cleaned_text = bleach.clean(text, tags, attrs, styles)


Stripping Markup
================

By default, Bleach *escapes* disallowed or invalid markup. For example::

    >>> bleach.clean('<span>is not allowed</span>')
    u'&lt;span&gt;is not allowed&lt;/span&gt;

If you would rather Bleach stripped this markup entirely, you can pass
``strip=True``::

    >>> bleach.clean('<span>is not allowed</span>', strip=True)
    u'is not allowed'


Stripping Comments
==================

By default, Bleach will strip out HTML comments. To disable this behavior, set
``strip_comments=False``::

    >>> html = 'my<!-- commented --> html'

    >>> bleach.clean(html)
    u'my html'

    >>> bleach.clean(html, strip_comments=False)
    u'my<!-- commented --> html'
