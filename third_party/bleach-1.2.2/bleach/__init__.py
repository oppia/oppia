import logging
import re
import sys

import html5lib
from html5lib.sanitizer import HTMLSanitizer
from html5lib.serializer.htmlserializer import HTMLSerializer

from . import callbacks as linkify_callbacks
from .encoding import force_unicode
from .sanitizer import BleachSanitizer


VERSION = (1, 2, 1)
__version__ = '1.2.1'

__all__ = ['clean', 'linkify']

log = logging.getLogger('bleach')

ALLOWED_TAGS = [
    'a',
    'abbr',
    'acronym',
    'b',
    'blockquote',
    'code',
    'em',
    'i',
    'li',
    'ol',
    'strong',
    'ul',
]

ALLOWED_ATTRIBUTES = {
    'a': ['href', 'title'],
    'abbr': ['title'],
    'acronym': ['title'],
}

ALLOWED_STYLES = []

TLDS = """ac ad ae aero af ag ai al am an ao aq ar arpa as asia at au aw ax az
       ba bb bd be bf bg bh bi biz bj bm bn bo br bs bt bv bw by bz ca cat
       cc cd cf cg ch ci ck cl cm cn co com coop cr cu cv cx cy cz de dj dk
       dm do dz ec edu ee eg er es et eu fi fj fk fm fo fr ga gb gd ge gf gg
       gh gi gl gm gn gov gp gq gr gs gt gu gw gy hk hm hn hr ht hu id ie il
       im in info int io iq ir is it je jm jo jobs jp ke kg kh ki km kn kp
       kr kw ky kz la lb lc li lk lr ls lt lu lv ly ma mc md me mg mh mil mk
       ml mm mn mo mobi mp mq mr ms mt mu museum mv mw mx my mz na name nc ne
       net nf ng ni nl no np nr nu nz om org pa pe pf pg ph pk pl pm pn pr pro
       ps pt pw py qa re ro rs ru rw sa sb sc sd se sg sh si sj sk sl sm sn so
       sr st su sv sy sz tc td tel tf tg th tj tk tl tm tn to tp tr travel tt
       tv tw tz ua ug uk us uy uz va vc ve vg vi vn vu wf ws xn ye yt yu za zm
       zw""".split()

PROTOCOLS = HTMLSanitizer.acceptable_protocols

TLDS.reverse()

url_re = re.compile(
    r"""\(*  # Match any opening parentheses.
    \b(?<![@.])(?:(?:%s):/{0,3}(?:(?:\w+:)?\w+@)?)?  # http://
    ([\w-]+\.)+(?:%s)(?:\:\d+)?(?!\.\w)\b   # xx.yy.tld(:##)?
    (?:[/?][^\s\{\}\|\\\^\[\]`<>"]*)?
        # /path/zz (excluding "unsafe" chars from RFC 1738,
        # except for # and ~, which happen in practice)
    """ % (u'|'.join(PROTOCOLS), u'|'.join(TLDS)),
    re.IGNORECASE | re.VERBOSE | re.UNICODE)

proto_re = re.compile(r'^[\w-]+:/{0,3}', re.IGNORECASE)

punct_re = re.compile(r'([\.,]+)$')

email_re = re.compile(
    r"""(?<!//)
    (([-!#$%&'*+/=?^_`{}|~0-9A-Z]+
        (\.[-!#$%&'*+/=?^_`{}|~0-9A-Z]+)*  # dot-atom
    |^"([\001-\010\013\014\016-\037!#-\[\]-\177]
        |\\[\001-011\013\014\016-\177])*"  # quoted-string
    )@(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z]{2,6})\.?  # domain
    """,
    re.IGNORECASE | re.MULTILINE | re.VERBOSE)

NODE_TEXT = 4  # The numeric ID of a text node in simpletree.

DEFAULT_CALLBACKS = [linkify_callbacks.nofollow]

PY_26 = (sys.version_info < (2, 7))
RECURSION_EXCEPTION = RuntimeError if not PY_26 else AttributeError


def clean(text, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRIBUTES,
          styles=ALLOWED_STYLES, strip=False, strip_comments=True):
    """Clean an HTML fragment and return it"""
    if not text:
        return u''

    text = force_unicode(text)

    class s(BleachSanitizer):
        allowed_elements = tags
        allowed_attributes = attributes
        allowed_css_properties = styles
        strip_disallowed_elements = strip
        strip_html_comments = strip_comments

    parser = html5lib.HTMLParser(tokenizer=s)

    return _render(parser.parseFragment(text))


def linkify(text, callbacks=DEFAULT_CALLBACKS, skip_pre=False,
            parse_email=False, tokenizer=HTMLSanitizer):
    """Convert URL-like strings in an HTML fragment to links.

    linkify() converts strings that look like URLs or domain names in a
    blob of text that may be an HTML fragment to links, while preserving
    (a) links already in the string, (b) urls found in attributes, and
    (c) email addresses.
    """
    text = force_unicode(text)

    if not text:
        return u''

    parser = html5lib.HTMLParser(tokenizer=tokenizer)

    forest = parser.parseFragment(text)

    def replace_nodes(tree, new_frag, node):
        new_tree = parser.parseFragment(new_frag)
        for n in new_tree.childNodes:
            # Prevent us from re-parsing links new links as existing links.
            if n.name == 'a':
                n._seen = True
            tree.insertBefore(n, node)
        tree.removeChild(node)
        # Return the number of new nodes.
        return len(new_tree.childNodes) - 1

    def strip_wrapping_parentheses(fragment):
        """Strips wrapping parentheses.

        Returns a tuple of the following format::

            (string stripped from wrapping parentheses,
             count of stripped opening parentheses,
             count of stripped closing parentheses)
        """
        opening_parentheses = closing_parentheses = 0
        # Count consecutive opening parentheses
        # at the beginning of the fragment (string).
        for char in fragment:
            if char == '(':
                opening_parentheses += 1
            else:
                break

        if opening_parentheses:
            newer_frag = ''
            # Cut the consecutive opening brackets from the fragment.
            fragment = fragment[opening_parentheses:]
            # Reverse the fragment for easier detection of parentheses
            # inside the URL.
            reverse_fragment = fragment[::-1]
            skip = False
            for char in reverse_fragment:
                # Remove the closing parentheses if it has a matching
                # opening parentheses (they are balanced).
                if (char == ')' and
                        closing_parentheses < opening_parentheses and
                        not skip):
                    closing_parentheses += 1
                    continue
                # Do not remove ')' from the URL itself.
                elif char != ')':
                    skip = True
                newer_frag += char
            fragment = newer_frag[::-1]

        return fragment, opening_parentheses, closing_parentheses

    def apply_callbacks(attrs, new):
        for cb in callbacks:
            attrs = cb(attrs, new)
            if attrs is None:
                return None
        return attrs

    def linkify_nodes(tree, parse_text=True):
        # I know this isn't Pythonic, but we're sometimes mutating
        # tree.childNodes, which ends up breaking the loop and causing us to
        # reparse code.
        children = len(tree.childNodes)
        current = 0  # A pointer to the "current" node.
        while current < children:
            node = tree.childNodes[current]
            if node.type == NODE_TEXT and parse_text:
                new_frag = _render(node)
                # Look for email addresses?
                if parse_email:
                    new_frag = re.sub(email_re, email_repl, new_frag)
                    if new_frag != _render(node):
                        adj = replace_nodes(tree, new_frag, node)
                        children += adj
                        current += adj
                        linkify_nodes(tree)
                        continue
                new_frag = re.sub(url_re, link_repl, new_frag)
                if new_frag != _render(node):
                    adj = replace_nodes(tree, new_frag, node)
                    children += adj
                    current += adj
            elif node.name == 'a' and not getattr(node, '_seen', False):
                if 'href' in node.attributes:
                    attrs = node.attributes
                    _text = attrs['_text'] = ''.join(c.toxml() for
                                                     c in node.childNodes)
                    attrs = apply_callbacks(attrs, False)
                    if attrs is not None:
                        text = force_unicode(attrs.pop('_text'))
                        node.attributes = attrs
                        for n in reversed(node.childNodes):
                            node.removeChild(n)
                        text = parser.parseFragment(text)
                        for n in text.childNodes:
                            node.appendChild(n)
                        node._seen = True
                    else:
                        replace_nodes(tree, _text, node)
            elif skip_pre and node.name == 'pre':
                linkify_nodes(node, False)
            elif not getattr(node, '_seen', False):
                linkify_nodes(node)
            current += 1

    def email_repl(match):
        addr = match.group(0).replace('"', '&quot;')
        link = {
            '_text': addr,
            'href': 'mailto:%s' % addr,
        }
        link = apply_callbacks(link, True)

        if link is None:
            return addr

        _href = link.pop('href')
        _text = link.pop('_text')

        repl = '<a href="%s" %s>%s</a>'
        attribs = ' '.join('%s="%s"' % (k, v) for k, v in link.items())
        return repl % (_href, attribs, _text)

    def link_repl(match):
        url = match.group(0)
        open_brackets = close_brackets = 0
        if url.startswith('('):
            url, open_brackets, close_brackets = (
                    strip_wrapping_parentheses(url)
            )
        end = u''
        m = re.search(punct_re, url)
        if m:
            end = m.group(0)
            url = url[0:m.start()]
        if re.search(proto_re, url):
            href = url
        else:
            href = u''.join([u'http://', url])

        link = {
            '_text': url,
            'href': href,
        }

        link = apply_callbacks(link, True)

        if link is None:
            return url

        _text = link.pop('_text')
        _href = link.pop('href')

        repl = u'%s<a href="%s" %s>%s</a>%s%s'
        attribs = ' '.join('%s="%s"' % (k, v) for k, v in link.items())

        return repl % ('(' * open_brackets,
                       _href, attribs, _text, end,
                       ')' * close_brackets)

    try:
        linkify_nodes(forest)
    except (RECURSION_EXCEPTION), e:
        # If we hit the max recursion depth, just return what we've got.
        log.exception('Probable recursion error: %r' % e)

    return _render(forest)


def _render(tree):
    """Try rendering as HTML, then XML, then give up."""
    try:
        return force_unicode(_serialize(tree))
    except AssertionError:  # The treewalker throws this sometimes.
        return force_unicode(tree.toxml())


def _serialize(domtree):
    walker = html5lib.treewalkers.getTreeWalker('simpletree')
    stream = walker(domtree)
    serializer = HTMLSerializer(quote_attr_values=True,
                                omit_optional_tags=False)
    return serializer.render(stream)
