# -*- coding: utf-8 -*-

from nose.tools import eq_

from bleach import clean, linkify


def test_japanese_safe_simple():
    eq_(u'ヘルプとチュートリアル', clean(u'ヘルプとチュートリアル'))
    eq_(u'ヘルプとチュートリアル', linkify(u'ヘルプとチュートリアル'))


def test_japanese_strip():
    eq_(u'<em>ヘルプとチュートリアル</em>',
        clean(u'<em>ヘルプとチュートリアル</em>'))
    eq_(u'&lt;span&gt;ヘルプとチュートリアル&lt;/span&gt;',
        clean(u'<span>ヘルプとチュートリアル</span>'))


def test_russian_simple():
    eq_(u'Домашняя', clean(u'Домашняя'))
    eq_(u'Домашняя', linkify(u'Домашняя'))


def test_mixed():
    eq_(u'Домашняяヘルプとチュートリアル',
        clean(u'Домашняяヘルプとチュートリアル'))


def test_mixed_linkify():
    eq_(u'Домашняя <a href="http://example.com" rel="nofollow">'
        u'http://example.com</a> ヘルプとチュートリアル',
        linkify(u'Домашняя http://example.com ヘルプとチュートリアル'))


def test_url_utf8():
    """Allow UTF8 characters in URLs themselves."""
    out = u'<a href="%(url)s" rel="nofollow">%(url)s</a>'

    tests = (
        ('http://éxámplé.com/', out % {'url': u'http://éxámplé.com/'}),
        ('http://éxámplé.com/íàñá/',
                out % {'url': u'http://éxámplé.com/íàñá/'}),
        ('http://éxámplé.com/íàñá/?foo=bar',
            out % {'url': u'http://éxámplé.com/íàñá/?foo=bar'}),
        ('http://éxámplé.com/íàñá/?fóo=bár',
            out % {'url': u'http://éxámplé.com/íàñá/?fóo=bár'}),
    )

    def check(test, expected_output):
        eq_(expected_output, linkify(test))

    for test, expected_output in tests:
        yield check, test, expected_output
