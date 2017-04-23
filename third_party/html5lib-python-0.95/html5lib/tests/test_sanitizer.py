import os
import sys
import unittest

try:
    import json
except ImportError:
    import simplejson as json

from html5lib import html5parser, sanitizer, constants

def runSanitizerTest(name, expected, input):
    expected = ''.join([token.toxml() for token in html5parser.HTMLParser().
                         parseFragment(expected).childNodes])
    expected = json.loads(json.dumps(expected))
    assert expected == sanitize_html(input)

def sanitize_html(stream):
    return ''.join([token.toxml() for token in
                    html5parser.HTMLParser(tokenizer=sanitizer.HTMLSanitizer).
                     parseFragment(stream).childNodes])

def test_should_handle_astral_plane_characters():
    assert u"<p>\U0001d4b5 \U0001d538</p>" == sanitize_html("<p>&#x1d4b5; &#x1d538;</p>")

def test_sanitizer():
    for tag_name in sanitizer.HTMLSanitizer.allowed_elements:
        if tag_name in ['caption', 'col', 'colgroup', 'optgroup', 'option', 'table', 'tbody', 'td', 'tfoot', 'th', 'thead', 'tr']:
            continue ### TODO
        if tag_name != tag_name.lower():
            continue ### TODO
        if tag_name == 'image':
            yield (runSanitizerTest, "test_should_allow_%s_tag" % tag_name,
              "<img title=\"1\"/>foo &lt;bad&gt;bar&lt;/bad&gt; baz",
              "<%s title='1'>foo <bad>bar</bad> baz</%s>" % (tag_name,tag_name))
        elif tag_name == 'br':
            yield (runSanitizerTest, "test_should_allow_%s_tag" % tag_name,
              "<br title=\"1\"/>foo &lt;bad&gt;bar&lt;/bad&gt; baz<br/>",
              "<%s title='1'>foo <bad>bar</bad> baz</%s>" % (tag_name,tag_name))
        elif tag_name in constants.voidElements:
            yield (runSanitizerTest, "test_should_allow_%s_tag" % tag_name,
              "<%s title=\"1\"/>foo &lt;bad&gt;bar&lt;/bad&gt; baz" % tag_name,
              "<%s title='1'>foo <bad>bar</bad> baz</%s>" % (tag_name,tag_name))
        else:
            yield (runSanitizerTest, "test_should_allow_%s_tag" % tag_name,
              "<%s title=\"1\">foo &lt;bad&gt;bar&lt;/bad&gt; baz</%s>" % (tag_name,tag_name),
              "<%s title='1'>foo <bad>bar</bad> baz</%s>" % (tag_name,tag_name))

    for tag_name in sanitizer.HTMLSanitizer.allowed_elements:
        tag_name = tag_name.upper()
        yield (runSanitizerTest, "test_should_forbid_%s_tag" % tag_name,
          "&lt;%s title=\"1\"&gt;foo &lt;bad&gt;bar&lt;/bad&gt; baz&lt;/%s&gt;" % (tag_name,tag_name),
          "<%s title='1'>foo <bad>bar</bad> baz</%s>" % (tag_name,tag_name))

    for attribute_name in sanitizer.HTMLSanitizer.allowed_attributes:
        if attribute_name != attribute_name.lower(): continue ### TODO
        if attribute_name == 'style': continue
        yield (runSanitizerTest, "test_should_allow_%s_attribute" % attribute_name,
          "<p %s=\"foo\">foo &lt;bad&gt;bar&lt;/bad&gt; baz</p>" % attribute_name,
          "<p %s='foo'>foo <bad>bar</bad> baz</p>" % attribute_name)

    for attribute_name in sanitizer.HTMLSanitizer.allowed_attributes:
        attribute_name = attribute_name.upper()
        yield (runSanitizerTest, "test_should_forbid_%s_attribute" % attribute_name,
          "<p>foo &lt;bad&gt;bar&lt;/bad&gt; baz</p>",
          "<p %s='display: none;'>foo <bad>bar</bad> baz</p>" % attribute_name)

    for protocol in sanitizer.HTMLSanitizer.allowed_protocols:
        yield (runSanitizerTest, "test_should_allow_%s_uris" % protocol,
          "<a href=\"%s\">foo</a>" % protocol,
          """<a href="%s">foo</a>""" % protocol)

    for protocol in sanitizer.HTMLSanitizer.allowed_protocols:
        yield (runSanitizerTest, "test_should_allow_uppercase_%s_uris" % protocol,
          "<a href=\"%s\">foo</a>" % protocol,
        """<a href="%s">foo</a>""" % protocol)
