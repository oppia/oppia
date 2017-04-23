import urllib

from html5lib.tokenizer import HTMLTokenizer
from nose.tools import eq_

from bleach import linkify, url_re, DEFAULT_CALLBACKS as DC




def test_url_re():
    def no_match(s):
        match = url_re.search(s)
        if match:
            assert not match, 'matched %s' % s[slice(*match.span())]
    yield no_match, 'just what i am looking for...it'


def test_empty():
    eq_('', linkify(''))


def test_simple_link():
    eq_('a <a href="http://example.com" rel="nofollow">http://example.com'
        '</a> link',
        linkify('a http://example.com link'))
    eq_('a <a href="https://example.com" rel="nofollow">https://example.com'
        '</a> link',
        linkify('a https://example.com link'))
    eq_('an <a href="http://example.com" rel="nofollow">example.com</a> link',
        linkify('an example.com link'))


def test_trailing_slash():
    eq_('<a href="http://example.com/" rel="nofollow">http://example.com/</a>',
       linkify('http://example.com/'))
    eq_('<a href="http://example.com/foo/" rel="nofollow">'
        'http://example.com/foo/</a>',
       linkify('http://example.com/foo/'))
    eq_('<a href="http://example.com/foo/bar/" rel="nofollow">'
        'http://example.com/foo/bar/</a>',
       linkify('http://example.com/foo/bar/'))


def test_mangle_link():
    """We can muck with the href attribute of the link."""
    def filter_url(attrs, new=False):
        attrs['href'] = (u'http://bouncer/?u=%s' %
                         urllib.quote_plus(attrs['href']))
        return attrs

    eq_('<a href="http://bouncer/?u=http%3A%2F%2Fexample.com" rel="nofollow">'
        'http://example.com</a>',
        linkify('http://example.com', DC + [filter_url]))


def test_mangle_text():
    """We can muck with the inner text of a link."""

    def ft(attrs, new=False):
        attrs['_text'] = 'bar'
        return attrs

    eq_('<a href="http://ex.mp">bar</a> <a href="http://ex.mp/foo">bar</a>',
        linkify('http://ex.mp <a href="http://ex.mp/foo">foo</a>', [ft]))


def test_email_link():
    tests = (
        ('a james@example.com mailto', False, 'a james@example.com mailto'),
        ('a james@example.com.au mailto', False,
            'a james@example.com.au mailto'),
        ('a <a href="mailto:james@example.com">james@example.com</a> mailto',
            True, 'a james@example.com mailto'),
        ('aussie <a href="mailto:james@example.com.au">'
            'james@example.com.au</a> mailto', True,
            'aussie james@example.com.au mailto'),
        # This is kind of a pathological case. I guess we do our best here.
        ('email to <a href="james@example.com" rel="nofollow">'
            'james@example.com</a>', True,
            'email to <a href="james@example.com">james@example.com</a>'),
    )

    def _check(o, p, i):
        eq_(o, linkify(i, parse_email=p))

    for (o, p, i) in tests:
        yield _check, o, p, i


def test_email_link_escaping():
    tests = (
        ('''<a href='mailto:"james"@example.com'>'''
            '''"james"@example.com</a>''',
            '"james"@example.com'),
        ('''<a href="mailto:&quot;j'ames&quot;@example.com">'''
            '''"j'ames"@example.com</a>''',
            '"j\'ames"@example.com'),
        ('''<a href='mailto:"ja>mes"@example.com'>'''
            '''"ja&gt;mes"@example.com</a>''',
            '"ja>mes"@example.com'),
    )

    def _check(o, i):
        eq_(o, linkify(i, parse_email=True))

    for (o, i) in tests:
        yield _check, o, i


def test_prevent_links():
    """Returning None from any callback should remove links or prevent them
    from being created."""

    def no_new_links(attrs, new=False):
        if new:
            return None
        return attrs

    def no_old_links(attrs, new=False):
        if not new:
            return None
        return attrs

    def noop(attrs, new=False):
        return attrs

    in_text = 'a ex.mp <a href="http://example.com">example</a>'
    out_text = 'a <a href="http://ex.mp">ex.mp</a> example'
    tests = (
        ([noop], ('a <a href="http://ex.mp">ex.mp</a> '
                  '<a href="http://example.com">example</a>'), 'noop'),
        ([no_new_links, noop], in_text, 'no new, noop'),
        ([noop, no_new_links], in_text, 'noop, no new'),
        ([no_old_links, noop], out_text, 'no old, noop'),
        ([noop, no_old_links], out_text, 'noop, no old'),
        ([no_old_links, no_new_links], 'a ex.mp example', 'no links'),
    )

    def _check(cb, o, msg):
        eq_(o, linkify(in_text, cb), msg)

    for (cb, o, msg) in tests:
        yield _check, cb, o, msg


def test_set_attrs():
    """We can set random attributes on links."""

    def set_attr(attrs, new=False):
        attrs['rev'] = 'canonical'
        return attrs

    eq_('<a href="http://ex.mp" rev="canonical">ex.mp</a>',
        linkify('ex.mp', [set_attr]))


def test_only_proto_links():
    """Only create links if there's a protocol."""
    def only_proto(attrs, new=False):
        if new and not attrs['_text'].startswith(('http:', 'https:')):
            return None
        return attrs

    in_text = 'a ex.mp http://ex.mp <a href="/foo">bar</a>'
    out_text = ('a ex.mp <a href="http://ex.mp">http://ex.mp</a> '
                '<a href="/foo">bar</a>')
    eq_(out_text, linkify(in_text, [only_proto]))


def test_stop_email():
    """Returning None should prevent a link from being created."""
    def no_email(attrs, new=False):
        if attrs['href'].startswith('mailto:'):
            return None
        return attrs
    text = 'do not link james@example.com'
    eq_(text, linkify(text, parse_email=True, callbacks=[no_email]))


def test_tlds():
    eq_('<a href="http://example.com" rel="nofollow">example.com</a>',
        linkify('example.com'))
    eq_('<a href="http://example.co.uk" rel="nofollow">example.co.uk</a>',
        linkify('example.co.uk'))
    eq_('<a href="http://example.edu" rel="nofollow">example.edu</a>',
        linkify('example.edu'))
    eq_('example.xxx', linkify('example.xxx'))
    eq_(' brie', linkify(' brie'))
    eq_('<a href="http://bit.ly/fun" rel="nofollow">bit.ly/fun</a>',
        linkify('bit.ly/fun'))


def test_escaping():
    eq_('&lt; unrelated', linkify('< unrelated'))


def test_nofollow_off():
    eq_('<a href="http://example.com">example.com</a>',
        linkify(u'example.com', []))


def test_link_in_html():
    eq_('<i><a href="http://yy.com" rel="nofollow">http://yy.com</a></i>',
        linkify('<i>http://yy.com</i>'))
    eq_('<em><strong><a href="http://xx.com" rel="nofollow">http://xx.com</a>'
        '</strong></em>',
        linkify('<em><strong>http://xx.com</strong></em>'))


def test_links_https():
    eq_('<a href="https://yy.com" rel="nofollow">https://yy.com</a>',
        linkify('https://yy.com'))


def test_add_rel_nofollow():
    """Verify that rel="nofollow" is added to an existing link"""
    eq_('<a href="http://yy.com" rel="nofollow">http://yy.com</a>',
        linkify('<a href="http://yy.com">http://yy.com</a>'))


def test_url_with_path():
    eq_('<a href="http://example.com/path/to/file" rel="nofollow">'
        'http://example.com/path/to/file</a>',
        linkify('http://example.com/path/to/file'))


def test_link_ftp():
    eq_('<a href="ftp://ftp.mozilla.org/some/file" rel="nofollow">'
        'ftp://ftp.mozilla.org/some/file</a>',
        linkify('ftp://ftp.mozilla.org/some/file'))


def test_link_query():
    eq_('<a href="http://xx.com/?test=win" rel="nofollow">'
        'http://xx.com/?test=win</a>',
        linkify('http://xx.com/?test=win'))
    eq_('<a href="http://xx.com/?test=win" rel="nofollow">'
        'xx.com/?test=win</a>',
        linkify('xx.com/?test=win'))
    eq_('<a href="http://xx.com?test=win" rel="nofollow">'
        'xx.com?test=win</a>',
        linkify('xx.com?test=win'))


def test_link_fragment():
    eq_('<a href="http://xx.com/path#frag" rel="nofollow">'
        'http://xx.com/path#frag</a>',
        linkify('http://xx.com/path#frag'))


def test_link_entities():
    eq_('<a href="http://xx.com/?a=1&amp;b=2" rel="nofollow">'
        'http://xx.com/?a=1&amp;b=2</a>',
        linkify('http://xx.com/?a=1&b=2'))


def test_escaped_html():
    """If I pass in escaped HTML, it should probably come out escaped."""
    s = '&lt;em&gt;strong&lt;/em&gt;'
    eq_(s, linkify(s))


def test_link_http_complete():
    eq_('<a href="https://user:pass@ftp.mozilla.org/x/y.exe?a=b&amp;c=d'
        '&amp;e#f" rel="nofollow">'
        'https://user:pass@ftp.mozilla.org/x/y.exe?a=b&amp;c=d&amp;e#f</a>',
        linkify('https://user:pass@ftp.mozilla.org/x/y.exe?a=b&c=d&e#f'))


def test_non_url():
    """document.vulnerable should absolutely not be linkified."""
    s = 'document.vulnerable'
    eq_(s, linkify(s))


def test_javascript_url():
    """javascript: urls should never be linkified."""
    s = 'javascript:document.vulnerable'
    eq_(s, linkify(s))


def test_unsafe_url():
    """Any unsafe char ({}[]<>, etc.) in the path should end URL scanning."""
    eq_('All your{"<a href="http://xx.yy.com/grover.png" '
                     'rel="nofollow">xx.yy.com/grover.png</a>"}base are',
        linkify('All your{"xx.yy.com/grover.png"}base are'))


def test_skip_pre():
    """Skip linkification in <pre> tags."""
    simple = 'http://xx.com <pre>http://xx.com</pre>'
    linked = ('<a href="http://xx.com" rel="nofollow">http://xx.com</a> '
              '<pre>http://xx.com</pre>')
    all_linked = ('<a href="http://xx.com" rel="nofollow">http://xx.com</a> '
                  '<pre><a href="http://xx.com" rel="nofollow">http://xx.com'
                  '</a></pre>')
    eq_(linked, linkify(simple, skip_pre=True))
    eq_(all_linked, linkify(simple))

    already_linked = '<pre><a href="http://xx.com">xx</a></pre>'
    nofollowed = '<pre><a href="http://xx.com" rel="nofollow">xx</a></pre>'
    eq_(nofollowed, linkify(already_linked))
    eq_(nofollowed, linkify(already_linked, skip_pre=True))


def test_libgl():
    """libgl.so.1 should not be linkified."""
    eq_('libgl.so.1', linkify('libgl.so.1'))


def test_end_of_sentence():
    """example.com. should match."""
    out = u'<a href="http://%s" rel="nofollow">%s</a>%s'
    in_ = u'%s%s'

    def check(u, p):
        eq_(out % (u, u, p), linkify(in_ % (u, p)))

    tests = (
        ('example.com', '.'),
        ('example.com', '...'),
        ('ex.com/foo', '.'),
        ('ex.com/foo', '....'),
    )

    for u, p in tests:
        yield check, u, p


def test_end_of_clause():
    """example.com/foo, shouldn't include the ,"""
    eq_('<a href="http://ex.com/foo" rel="nofollow">ex.com/foo</a>, bar',
        linkify('ex.com/foo, bar'))


def test_sarcasm():
    """Jokes should crash.<sarcasm/>"""
    dirty = u'Yeah right <sarcasm/>'
    clean = u'Yeah right &lt;sarcasm/&gt;'
    eq_(clean, linkify(dirty))


def test_wrapping_parentheses():
    """URLs wrapped in parantheses should not include them."""
    out = u'%s<a href="http://%s" rel="nofollow">%s</a>%s'

    tests = (
        ('(example.com)', out % ('(', 'example.com', 'example.com', ')')),
        ('(example.com/)', out % ('(', 'example.com/', 'example.com/', ')')),
        ('(example.com/foo)', out % ('(', 'example.com/foo',
                                     'example.com/foo', ')')),
        ('(((example.com/))))', out % ('(((', 'example.com/)',
                                       'example.com/)', ')))')),
        ('example.com/))', out % ('', 'example.com/))',
                                  'example.com/))', '')),
        ('http://en.wikipedia.org/wiki/Test_(assessment)',
            out % ('', 'en.wikipedia.org/wiki/Test_(assessment)',
                   'http://en.wikipedia.org/wiki/Test_(assessment)', '')),
        ('(http://en.wikipedia.org/wiki/Test_(assessment))',
            out % ('(', 'en.wikipedia.org/wiki/Test_(assessment)',
                   'http://en.wikipedia.org/wiki/Test_(assessment)', ')')),
        ('((http://en.wikipedia.org/wiki/Test_(assessment))',
            out % ('((', 'en.wikipedia.org/wiki/Test_(assessment',
                   'http://en.wikipedia.org/wiki/Test_(assessment', '))')),
        ('(http://en.wikipedia.org/wiki/Test_(assessment)))',
            out % ('(', 'en.wikipedia.org/wiki/Test_(assessment))',
                   'http://en.wikipedia.org/wiki/Test_(assessment))', ')')),
        ('(http://en.wikipedia.org/wiki/)Test_(assessment',
            out % ('(', 'en.wikipedia.org/wiki/)Test_(assessment',
                   'http://en.wikipedia.org/wiki/)Test_(assessment', '')),
    )

    def check(test, expected_output):
        eq_(expected_output, linkify(test))

    for test, expected_output in tests:
        yield check, test, expected_output


def test_ports():
    """URLs can contain port numbers."""
    tests = (
        ('http://foo.com:8000', ('http://foo.com:8000', '')),
        ('http://foo.com:8000/', ('http://foo.com:8000/', '')),
        ('http://bar.com:xkcd', ('http://bar.com', ':xkcd')),
        ('http://foo.com:81/bar', ('http://foo.com:81/bar', '')),
        ('http://foo.com:', ('http://foo.com', ':')),
    )

    def check(test, output):
        eq_(u'<a href="{0}" rel="nofollow">{0}</a>{1}'.format(*output),
            linkify(test))

    for test, output in tests:
        yield check, test, output


def test_tokenizer():
    """Linkify doesn't always have to sanitize."""
    raw = '<em>test<x></x></em>'
    eq_('<em>test&lt;x&gt;&lt;/x&gt;</em>', linkify(raw))
    eq_(raw, linkify(raw, tokenizer=HTMLTokenizer))


def test_ignore_bad_protocols():
    eq_('foohttp://bar',
        linkify('foohttp://bar'))
    eq_('foohttp://<a href="http://exampl.com" rel="nofollow">exampl.com</a>',
        linkify('foohttp://exampl.com'))


def test_max_recursion_depth():
    """If we hit the max recursion depth, just return the string."""
    test = '<em>' * 2000 + 'foo' + '</em>' * 2000
    eq_(test, linkify(test))


def test_link_emails_and_urls():
    """parse_email=True shouldn't prevent URLs from getting linkified."""
    output = ('<a href="http://example.com" rel="nofollow">'
              'http://example.com</a> <a href="mailto:person@example.com">'
              'person@example.com</a>')
    eq_(output, linkify('http://example.com person@example.com',
                        parse_email=True))


def test_links_case_insensitive():
    """Protocols and domain names are case insensitive."""
    expect = ('<a href="HTTP://EXAMPLE.COM" rel="nofollow">'
              'HTTP://EXAMPLE.COM</a>')
    eq_(expect, linkify('HTTP://EXAMPLE.COM'))


def test_elements_inside_links():
    eq_(u'<a href="#" rel="nofollow">hello<br></a>',
        linkify('<a href="#">hello<br></a>'))

    eq_(u'<a href="#" rel="nofollow"><strong>bold</strong> hello<br></a>',
        linkify('<a href="#"><strong>bold</strong> hello<br></a>'))
