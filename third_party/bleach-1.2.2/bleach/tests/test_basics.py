import html5lib
from nose.tools import eq_

import bleach


def test_empty():
    eq_('', bleach.clean(''))


def test_nbsp():
    eq_(u'\xa0test string\xa0', bleach.clean('&nbsp;test string&nbsp;'))


def test_comments_only():
    comment = '<!-- this is a comment -->'
    open_comment = '<!-- this is an open comment'
    eq_('', bleach.clean(comment))
    eq_('', bleach.clean(open_comment))
    eq_(comment, bleach.clean(comment, strip_comments=False))
    eq_('%s-->' % open_comment, bleach.clean(open_comment,
                                             strip_comments=False))


def test_with_comments():
    html = '<!-- comment -->Just text'
    eq_('Just text', bleach.clean(html))
    eq_(html, bleach.clean(html, strip_comments=False))


def test_no_html():
    eq_('no html string', bleach.clean('no html string'))


def test_allowed_html():
    eq_('an <strong>allowed</strong> tag',
        bleach.clean('an <strong>allowed</strong> tag'))
    eq_('another <em>good</em> tag',
        bleach.clean('another <em>good</em> tag'))


def test_bad_html():
    eq_('a <em>fixed tag</em>',
        bleach.clean('a <em>fixed tag'))


def test_function_arguments():
    TAGS = ['span', 'br']
    ATTRS = {'span': ['style']}

    eq_('a <br><span style="">test</span>',
        bleach.clean('a <br/><span style="color:red">test</span>',
                     tags=TAGS, attributes=ATTRS))


def test_named_arguments():
    ATTRS = {'a': ['rel', 'href']}
    s = u'<a href="http://xx.com" rel="alternate">xx.com</a>'
    eq_('<a href="http://xx.com">xx.com</a>', bleach.clean(s))
    eq_(s, bleach.clean(s, attributes=ATTRS))


def test_disallowed_html():
    eq_('a &lt;script&gt;safe()&lt;/script&gt; test',
        bleach.clean('a <script>safe()</script> test'))
    eq_('a &lt;style&gt;body{}&lt;/style&gt; test',
        bleach.clean('a <style>body{}</style> test'))


def test_bad_href():
    eq_('<em>no link</em>',
        bleach.clean('<em href="fail">no link</em>'))


def test_bare_entities():
    eq_('an &amp; entity', bleach.clean('an & entity'))
    eq_('an &lt; entity', bleach.clean('an < entity'))
    eq_('tag &lt; <em>and</em> entity',
        bleach.clean('tag < <em>and</em> entity'))
    eq_('&amp;', bleach.clean('&amp;'))


def test_escaped_entities():
    s = u'&lt;em&gt;strong&lt;/em&gt;'
    eq_(s, bleach.clean(s))


def test_serializer():
    s = u'<table></table>'
    eq_(s, bleach.clean(s, tags=['table']))
    eq_(u'test<table></table>', bleach.linkify(u'<table>test</table>'))
    eq_(u'<p>test</p>', bleach.clean(u'<p>test</p>', tags=['p']))


def test_no_href_links():
    s = u'<a name="anchor">x</a>'
    eq_(s, bleach.linkify(s))


def test_weird_strings():
    s = '</3'
    eq_(bleach.clean(s), '')


def test_xml_render():
    parser = html5lib.HTMLParser()
    eq_(bleach._render(parser.parseFragment('')), '')


def test_stripping():
    eq_('a test <em>with</em> <b>html</b> tags',
        bleach.clean('a test <em>with</em> <b>html</b> tags', strip=True))
    eq_('a test <em>with</em>  <b>html</b> tags',
        bleach.clean('a test <em>with</em> <img src="http://example.com/"> '
                '<b>html</b> tags', strip=True))

    s = '<p><a href="http://example.com/">link text</a></p>'
    eq_('<p>link text</p>', bleach.clean(s, tags=['p'], strip=True))
    s = '<p><span>multiply <span>nested <span>text</span></span></span></p>'
    eq_('<p>multiply nested text</p>', bleach.clean(s, tags=['p'], strip=True))

    s = ('<p><a href="http://example.com/"><img src="http://example.com/">'
         '</a></p>')
    eq_('<p><a href="http://example.com/"></a></p>',
        bleach.clean(s, tags=['p', 'a'], strip=True))


def test_allowed_styles():
    ATTR = ['style']
    STYLE = ['color']
    blank = '<b style=""></b>'
    s = '<b style="color: blue;"></b>'
    eq_(blank, bleach.clean('<b style="top:0"></b>', attributes=ATTR))
    eq_(s, bleach.clean(s, attributes=ATTR, styles=STYLE))
    eq_(s, bleach.clean('<b style="top: 0; color: blue;"></b>',
                        attributes=ATTR, styles=STYLE))


def test_idempotent():
    """Make sure that applying the filter twice doesn't change anything."""
    dirty = u'<span>invalid & </span> < extra http://link.com<em>'

    clean = bleach.clean(dirty)
    eq_(clean, bleach.clean(clean))

    linked = bleach.linkify(dirty)
    eq_(linked, bleach.linkify(linked))


def test_lowercase_html():
    """We should output lowercase HTML."""
    dirty = u'<EM CLASS="FOO">BAR</EM>'
    clean = u'<em class="FOO">BAR</em>'
    eq_(clean, bleach.clean(dirty, attributes=['class']))


def test_wildcard_attributes():
    ATTR = {
        '*': ['id'],
        'img': ['src'],
    }
    TAG = ['img', 'em']
    dirty = (u'both <em id="foo" style="color: black">can</em> have '
             u'<img id="bar" src="foo"/>')
    clean = u'both <em id="foo">can</em> have <img id="bar" src="foo">'
    eq_(clean, bleach.clean(dirty, tags=TAG, attributes=ATTR))


def test_sarcasm():
    """Jokes should crash.<sarcasm/>"""
    dirty = u'Yeah right <sarcasm/>'
    clean = u'Yeah right &lt;sarcasm/&gt;'
    eq_(clean, bleach.clean(dirty))
