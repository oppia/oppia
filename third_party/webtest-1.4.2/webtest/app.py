# (c) 2005 Ian Bicking and contributors; written for Paste
# (http://pythonpaste.org)
# Licensed under the MIT license:
# http://www.opensource.org/licenses/mit-license.php
"""
Routines for testing WSGI applications.

Most interesting is TestApp
"""

import random
import warnings
import mimetypes
import cgi
import os
import re
import fnmatch
from webtest.compat import urlparse
from webtest.compat import print_stderr
from webtest.compat import StringIO
from webtest.compat import BytesIO
from webtest.compat import SimpleCookie, CookieError
from webtest.compat import cookie_quote
from webtest.compat import urlencode
from webtest.compat import splittype
from webtest.compat import splithost
from webtest.compat import string_types
from webtest.compat import binary_type
from webtest.compat import text_type
from webtest.compat import to_string
from webtest.compat import to_bytes
from webtest.compat import join_bytes
from webtest.compat import OrderedDict
from webtest.compat import dumps
from webtest.compat import loads
from webtest.compat import PY3
from webob import Request, Response

if PY3:
    from webtest import lint3 as lint
else:
    from webtest import lint  # NOQA

__all__ = ['TestApp', 'TestRequest']


class NoDefault(object):
    pass


class AppError(Exception):

    def __init__(self, message, *args):
        message = to_string(message)
        str_args = ()
        for arg in args:
            if isinstance(arg, Response):
                body = arg.body
                if isinstance(body, binary_type):
                    if arg.charset:
                        arg = body.decode(arg.charset)
                    else:
                        arg = repr(body)
            elif isinstance(arg, binary_type):
                try:
                    arg = to_string(arg)
                except UnicodeDecodeError:
                    arg = repr(arg)
            str_args += (arg,)
        message = message % str_args
        Exception.__init__(self, message)


class TestResponse(Response):

    """
    Instances of this class are return by ``TestApp``
    """

    request = None
    _forms_indexed = None

    def forms__get(self):
        """
        Returns a dictionary of :class:`~webtest.Form` objects.  Indexes are
        both in order (from zero) and by form id (if the form is given an id).
        """
        if self._forms_indexed is None:
            self._parse_forms()
        return self._forms_indexed

    forms = property(forms__get,
                     doc="""
                     A list of :class:`~webtest.Form`s found on the page
                     """)

    def form__get(self):
        forms = self.forms
        if not forms:
            raise TypeError(
                "You used response.form, but no forms exist")
        if 1 in forms:
            # There is more than one form
            raise TypeError(
                "You used response.form, but more than one form exists")
        return forms[0]

    form = property(form__get,
                    doc="""
                    Returns a single :class:`~webtest.Form` instance; it is an
                    error if there are multiple forms on the page.
                    """)

    @property
    def testbody(self):
        if getattr(self, '_use_unicode', True) and self.charset:
            return self.unicode_body
        if PY3:
            return to_string(self.body)
        return self.body

    _tag_re = re.compile(r'<(/?)([:a-z0-9_\-]*)(.*?)>', re.S | re.I)

    def _parse_forms(self):
        forms = self._forms_indexed = {}
        form_texts = []
        started = None
        for match in self._tag_re.finditer(self.testbody):
            end = match.group(1) == '/'
            tag = match.group(2).lower()
            if tag != 'form':
                continue
            if end:
                assert started, (
                    "</form> unexpected at %s" % match.start())
                form_texts.append(self.testbody[started:match.end()])
                started = None
            else:
                assert not started, (
                    "Nested form tags at %s" % match.start())
                started = match.start()
        assert not started, (
            "Danging form: %r" % self.testbody[started:])
        for i, text in enumerate(form_texts):
            form = Form(self, text)
            forms[i] = form
            if form.id:
                forms[form.id] = form

    def follow(self, **kw):
        """
        If this request is a redirect, follow that redirect.  It
        is an error if this is not a redirect response.  Returns
        another response object.
        """
        assert self.status_int >= 300 and self.status_int < 400, (
            "You can only follow redirect responses (not %s)"
            % self.status)
        location = self.headers['location']
        type, rest = splittype(location)
        host, path = splithost(rest)
        # @@: We should test that it's not a remote redirect
        return self.test_app.get(location, **kw)

    def click(self, description=None, linkid=None, href=None,
              anchor=None, index=None, verbose=False,
              extra_environ=None):
        """
        Click the link as described.  Each of ``description``,
        ``linkid``, and ``url`` are *patterns*, meaning that they are
        either strings (regular expressions), compiled regular
        expressions (objects with a ``search`` method), or callables
        returning true or false.

        All the given patterns are ANDed together:

        * ``description`` is a pattern that matches the contents of the
          anchor (HTML and all -- everything between ``<a...>`` and
          ``</a>``)

        * ``linkid`` is a pattern that matches the ``id`` attribute of
          the anchor.  It will receive the empty string if no id is
          given.

        * ``href`` is a pattern that matches the ``href`` of the anchor;
          the literal content of that attribute, not the fully qualified
          attribute.

        * ``anchor`` is a pattern that matches the entire anchor, with
          its contents.

        If more than one link matches, then the ``index`` link is
        followed.  If ``index`` is not given and more than one link
        matches, or if no link matches, then ``IndexError`` will be
        raised.

        If you give ``verbose`` then messages will be printed about
        each link, and why it does or doesn't match.  If you use
        ``app.click(verbose=True)`` you'll see a list of all the
        links.

        You can use multiple criteria to essentially assert multiple
        aspects about the link, e.g., where the link's destination is.
        """
        __tracebackhide__ = True # NOQA
        found_html, found_desc, found_attrs = self._find_element(
            tag='a', href_attr='href',
            href_extract=None,
            content=description,
            id=linkid,
            href_pattern=href,
            html_pattern=anchor,
            index=index, verbose=verbose)
        return self.goto(found_attrs['uri'], extra_environ=extra_environ)

    def clickbutton(self, description=None, buttonid=None, href=None,
                    button=None, index=None, verbose=False):
        """
        Like ``.click()``, except looks for link-like buttons.
        This kind of button should look like
        ``<button onclick="...location.href='url'...">``.
        """
        __tracebackhide__ = True # NOQA
        found_html, found_desc, found_attrs = self._find_element(
            tag='button', href_attr='onclick',
            href_extract=re.compile(r"location\.href='(.*?)'"),
            content=description,
            id=buttonid,
            href_pattern=href,
            html_pattern=button,
            index=index, verbose=verbose)
        return self.goto(found_attrs['uri'])

    def _find_element(self, tag, href_attr, href_extract,
                      content, id,
                      href_pattern,
                      html_pattern,
                      index, verbose):
        content_pat = _make_pattern(content)
        id_pat = _make_pattern(id)
        href_pat = _make_pattern(href_pattern)
        html_pat = _make_pattern(html_pattern)

        body = self.testbody

        _tag_re = re.compile(r'<%s\s+(.*?)>(.*?)</%s>' % (tag, tag),
                             re.I + re.S)
        _script_re = re.compile(r'<script.*?>.*?</script>', re.I | re.S)
        bad_spans = []
        for match in _script_re.finditer(body):
            bad_spans.append((match.start(), match.end()))

        def printlog(s):
            if verbose:
                print(s)

        found_links = []
        total_links = 0
        for match in _tag_re.finditer(body):
            found_bad = False
            for bad_start, bad_end in bad_spans:
                if (match.start() > bad_start
                    and match.end() < bad_end):
                    found_bad = True
                    break
            if found_bad:
                continue
            el_html = match.group(0)
            el_attr = match.group(1)
            el_content = match.group(2)
            attrs = _parse_attrs(el_attr)
            if verbose:
                printlog('Element: %r' % el_html)
            if not attrs.get(href_attr):
                printlog('  Skipped: no %s attribute' % href_attr)
                continue
            el_href = attrs[href_attr]
            if href_extract:
                m = href_extract.search(el_href)
                if not m:
                    printlog("  Skipped: doesn't match extract pattern")
                    continue
                el_href = m.group(1)
            attrs['uri'] = el_href
            if el_href.startswith('#'):
                printlog('  Skipped: only internal fragment href')
                continue
            if el_href.startswith('javascript:'):
                printlog('  Skipped: cannot follow javascript:')
                continue
            total_links += 1
            if content_pat and not content_pat(el_content):
                printlog("  Skipped: doesn't match description")
                continue
            if id_pat and not id_pat(attrs.get('id', '')):
                printlog("  Skipped: doesn't match id")
                continue
            if href_pat and not href_pat(el_href):
                printlog("  Skipped: doesn't match href")
                continue
            if html_pat and not html_pat(el_html):
                printlog("  Skipped: doesn't match html")
                continue
            printlog("  Accepted")
            found_links.append((el_html, el_content, attrs))
        if not found_links:
            raise IndexError(
                "No matching elements found (from %s possible)"
                % total_links)
        if index is None:
            if len(found_links) > 1:
                raise IndexError(
                    "Multiple links match: %s"
                    % ', '.join([repr(anc) for anc, d, attr in found_links]))
            found_link = found_links[0]
        else:
            try:
                found_link = found_links[index]
            except IndexError:
                raise IndexError(
                    "Only %s (out of %s) links match; index %s out of range"
                    % (len(found_links), total_links, index))
        return found_link

    def goto(self, href, method='get', **args):
        """
        Go to the (potentially relative) link ``href``, using the
        given method (``'get'`` or ``'post'``) and any extra arguments
        you want to pass to the ``app.get()`` or ``app.post()``
        methods.

        All hostnames and schemes will be ignored.
        """
        scheme, host, path, query, fragment = urlparse.urlsplit(href)
        # We
        scheme = host = fragment = ''
        href = urlparse.urlunsplit((scheme, host, path, query, fragment))
        href = urlparse.urljoin(self.request.url, href)
        method = method.lower()
        assert method in ('get', 'post'), (
            'Only "get" or "post" are allowed for method (you gave %r)'
            % method)

        # encode unicode strings for the outside world
        if not PY3 and getattr(self, '_use_unicode', False):
            def to_str(s):
                if isinstance(s, text_type):
                    return s.encode(self.charset)
                return s

            href = to_str(href)

            if 'params' in args:
                args['params'] = [tuple(map(to_str, p)) \
                                        for p in args['params']]

            if 'upload_files' in args:
                args['upload_files'] = [map(to_str, f) \
                                            for f in args['upload_files']]

            if 'content_type' in args:
                args['content_type'] = to_str(args['content_type'])

        if method == 'get':
            method = self.test_app.get
        else:
            method = self.test_app.post
        return method(href, **args)

    _normal_body_regex = re.compile(to_bytes(r'[ \n\r\t]+'))

    _normal_body = None

    def normal_body__get(self):
        if self._normal_body is None:
            self._normal_body = self._normal_body_regex.sub(
                to_bytes(' '), self.body)
        return self._normal_body

    normal_body = property(normal_body__get,
                           doc="""
                           Return the whitespace-normalized body
                           """.strip())

    def unicode_normal_body__get(self):
        if not self.charset:
            raise AttributeError(
                ("You cannot access Response.unicode_normal_body "
                 "unless charset is set"))
        return self.normal_body.decode(self.charset)

    unicode_normal_body = property(
        unicode_normal_body__get, doc="""
        Return the whitespace-normalized body, as unicode
        """.strip())

    def __contains__(self, s):
        """
        A response 'contains' a string if it is present in the body
        of the response.  Whitespace is normalized when searching
        for a string.
        """
        if not isinstance(s, string_types):
            if hasattr(s, '__unicode__'):
                s = s.__unicode__()
            else:
                s = str(s)
        # PY3 Workaround.
        # We don't want to search for str when we have no charset
        if isinstance(s, text_type) and not self.charset:
            s = to_bytes(s)
        if isinstance(s, text_type):
            body = self.unicode_body
            normal_body = self.unicode_normal_body
        else:
            body = self.body
            normal_body = self.normal_body
        return s in body or s in normal_body

    def mustcontain(self, *strings, **kw):
        """
        Assert that the response contains all of the strings passed
        in as arguments.

        Equivalent to::

            assert string in res
        """
        if 'no' in kw:
            no = kw['no']
            del kw['no']
            if isinstance(no, string_types):
                no = [no]
        else:
            no = []
        if kw:
            raise TypeError(
                "The only keyword argument allowed is 'no'")
        for s in strings:
            if not s in self:
                print_stderr("Actual response (no %r):" % s)
                print_stderr(str(self))
                raise IndexError(
                    "Body does not contain string %r" % s)
        for no_s in no:
            if no_s in self:
                print_stderr("Actual response (has %r)" % no_s)
                print_stderr(str(self))
                raise IndexError(
                    "Body contains bad string %r" % no_s)

    def __str__(self):
        simple_body = '\n'.join([l for l in self.testbody.splitlines()
                                 if l.strip()])
        headers = [(n.title(), v)
                   for n, v in self.headerlist
                   if n.lower() != 'content-length']
        headers.sort()
        output = 'Response: %s\n%s\n%s' % (
            to_string(self.status),
            '\n'.join(['%s: %s' % (n, v) for n, v in headers]),
            simple_body)
        if not PY3 and isinstance(output, text_type):
            output = output.encode(self.charset or 'utf-8', 'replace')
        return output

    def __unicode__(self):
        output = str(self)
        if PY3:
            return output
        return output.decode(self.charset or 'utf-8', 'replace')

    def __repr__(self):
        # Specifically intended for doctests
        if self.content_type:
            ct = ' %s' % self.content_type
        else:
            ct = ''
        if self.body:
            br = repr(self.body)
            if len(br) > 18:
                br = br[:10] + '...' + br[-5:]
                br += '/%s' % len(self.body)
            body = ' body=%s' % br
        else:
            body = ' no body'
        if self.location:
            location = ' location: %s' % self.location
        else:
            location = ''
        return ('<' + to_string(self.status) + ct + location + body + '>')

    def html(self):
        """
        Returns the response as a `BeautifulSoup
        <http://www.crummy.com/software/BeautifulSoup/documentation.html>`_
        object.

        Only works with HTML responses; other content-types raise
        AttributeError.
        """
        if 'html' not in self.content_type:
            raise AttributeError(
                "Not an HTML response body (content-type: %s)"
                % self.content_type)
        try:
            from BeautifulSoup import BeautifulSoup
        except ImportError:
            try:
                from bs4 import BeautifulSoup # NOQA
            except ImportError:
                raise ImportError(
                    "You must have BeautifulSoup installed to use "
                    "response.html")
        soup = BeautifulSoup(self.testbody)
        return soup

    html = property(html, doc=html.__doc__)

    def xml(self):
        """
        Returns the response as an `ElementTree
        <http://python.org/doc/current/lib/module-xml.etree.ElementTree.html>`_
        object.

        Only works with XML responses; other content-types raise
        AttributeError
        """
        if 'xml' not in self.content_type:
            raise AttributeError(
                "Not an XML response body (content-type: %s)"
                % self.content_type)
        try:
            from xml.etree import ElementTree
        except ImportError:
            try:
                import ElementTree
            except ImportError:
                try:
                    from elementtree import ElementTree # NOQA
                except ImportError:
                    raise ImportError(
                        ("You must have ElementTree installed "
                         "(or use Python 2.5) to use response.xml"))
        # ElementTree can't parse unicode => use `body` instead of `testbody`
        return ElementTree.XML(self.body)

    xml = property(xml, doc=xml.__doc__)

    def lxml(self):
        """
        Returns the response as an `lxml object
        <http://codespeak.net/lxml/>`_.  You must have lxml installed
        to use this.

        If this is an HTML response and you have lxml 2.x installed,
        then an ``lxml.html.HTML`` object will be returned; if you
        have an earlier version of lxml then a ``lxml.HTML`` object
        will be returned.
        """
        if ('html' not in self.content_type
            and 'xml' not in self.content_type):
            raise AttributeError(
                "Not an XML or HTML response body (content-type: %s)"
                % self.content_type)
        try:
            from lxml import etree
        except ImportError:
            raise ImportError(
                "You must have lxml installed to use response.lxml")
        try:
            from lxml.html import fromstring
        except ImportError:
            fromstring = etree.HTML
        ## FIXME: would be nice to set xml:base, in some fashion
        if self.content_type == 'text/html':
            return fromstring(self.testbody, base_url=self.request.url)
        else:
            return etree.XML(self.testbody, base_url=self.request.url)

    lxml = property(lxml, doc=lxml.__doc__)

    def json(self):
        """
        Return the response as a JSON response.  You must have `simplejson
        <http://goo.gl/B9g6s>`_ installed to use this, or be using a Python
        version with the json module.

        The content type must be application/json to use this.
        """
        if self.content_type != 'application/json':
            raise AttributeError(
                "Not a JSON response body (content-type: %s)"
                % self.content_type)
        if loads is None:
            raise ImportError(
                "You must have simplejson installed to use response.json")
        return loads(self.testbody)

    json = property(json, doc=json.__doc__)

    def pyquery(self):
        """
        Returns the response as a `PyQuery <http://pyquery.org/>`_ object.

        Only works with HTML and XML responses; other content-types raise
        AttributeError.
        """
        if 'html' not in self.content_type and 'xml' not in self.content_type:
            raise AttributeError(
                "Not an HTML or XML response body (content-type: %s)"
                % self.content_type)
        try:
            from pyquery import PyQuery
        except ImportError:
            raise ImportError(
                "You must have PyQuery installed to use response.pyquery")
        d = PyQuery(self.testbody)
        return d

    pyquery = property(pyquery, doc=pyquery.__doc__)

    def showbrowser(self):
        """
        Show this response in a browser window (for debugging purposes,
        when it's hard to read the HTML).
        """
        import webbrowser
        import tempfile
        f = tempfile.NamedTemporaryFile(prefix='webtest-page',
                                         suffix='.html')
        name = f.name
        f.close()
        f = open(name, 'w')
        f.write(to_string(self.body))
        f.close()
        if name[0] != '/':
            # windows ...
            url = 'file:///' + name
        else:
            url = 'file://' + name
        webbrowser.open_new(url)


class TestRequest(Request):

    # for py.test
    disabled = True
    ResponseClass = TestResponse


class TestApp(object):
    """
    Wraps a WSGI application in a more convenient interface for
    testing.

    ``app`` may be an application, or a Paste Deploy app
    URI, like ``'config:filename.ini#test'``.

    ``extra_environ`` is a dictionary of values that should go
    into the environment for each request.  These can provide a
    communication channel with the application.

    ``relative_to`` is a directory, and filenames used for file
    uploads are calculated relative to this.  Also ``config:``
    URIs that aren't absolute.
    """

    # for py.test
    disabled = True
    RequestClass = TestRequest

    def __init__(self, app, extra_environ=None, relative_to=None,
                       use_unicode=True):
        if isinstance(app, string_types):
            from paste.deploy import loadapp
            # @@: Should pick up relative_to from calling module's
            # __file__
            app = loadapp(app, relative_to=relative_to)
        self.app = app
        self.relative_to = relative_to
        if extra_environ is None:
            extra_environ = {}
        self.extra_environ = extra_environ
        self.use_unicode = use_unicode
        self.reset()

    def reset(self):
        """
        Resets the state of the application; currently just clears
        saved cookies.
        """
        self.cookies = {}

    def _make_environ(self, extra_environ=None):
        environ = self.extra_environ.copy()
        environ['paste.throw_errors'] = True
        if extra_environ:
            environ.update(extra_environ)
        return environ

    def _remove_fragment(self, url):
        scheme, netloc, path, query, fragment = urlparse.urlsplit(url)
        return urlparse.urlunsplit((scheme, netloc, path, query, ""))

    def get(self, url, params=None, headers=None, extra_environ=None,
            status=None, expect_errors=False):
        """
        Get the given url (well, actually a path like
        ``'/page.html'``).

        ``params``:
            A query string, or a dictionary that will be encoded
            into a query string.  You may also include a query
            string on the ``url``.

        ``headers``:
            A dictionary of extra headers to send.

        ``extra_environ``:
            A dictionary of environmental variables that should
            be added to the request.

        ``status``:
            The integer status code you expect (if not 200 or 3xx).
            If you expect a 404 response, for instance, you must give
            ``status=404`` or it will be an error.  You can also give
            a wildcard, like ``'3*'`` or ``'*'``.

        ``expect_errors``:
            If this is not true, then if anything is written to
            ``wsgi.errors`` it will be an error.  If it is true, then
            non-200/3xx responses are also okay.

        Returns a :class:`webtest.TestResponse` object.
        """
        environ = self._make_environ(extra_environ)
        # Hide from py.test:
        __tracebackhide__ = True # NOQA
        url = str(url)
        url = self._remove_fragment(url)
        if params:
            if not isinstance(params, string_types):
                params = urlencode(params, doseq=True)
            if '?' in url:
                url += '&'
            else:
                url += '?'
            url += params
        if '?' in url:
            url, environ['QUERY_STRING'] = url.split('?', 1)
        else:
            environ['QUERY_STRING'] = ''
        req = self.RequestClass.blank(url, environ)
        if headers:
            req.headers.update(headers)
        return self.do_request(req, status=status,
                               expect_errors=expect_errors)

    def _gen_request(self, method, url, params='', headers=None,
                           extra_environ=None, status=None, upload_files=None,
                           expect_errors=False, content_type=None):
        """
        Do a generic request.
        """
        environ = self._make_environ(extra_environ)

        inline_uploads = []

        # this supports OrderedDict
        if isinstance(params, dict) or hasattr(params, 'items'):
            params = list(params.items())

        if isinstance(params, (list, tuple)):
            inline_uploads = [v for (k, v) in params
                              if isinstance(v, (File, Upload))]

        if len(inline_uploads) > 0:
            content_type, params = self.encode_multipart(
                params, upload_files or ())
            environ['CONTENT_TYPE'] = content_type
        else:
            params = encode_params(params, content_type)
            if upload_files or \
                (content_type and \
                 to_string(content_type).startswith('multipart')):
                params = cgi.parse_qsl(params, keep_blank_values=True)
                content_type, params = self.encode_multipart(
                    params, upload_files or ())
                environ['CONTENT_TYPE'] = content_type
            elif params:
                environ.setdefault('CONTENT_TYPE',
                               'application/x-www-form-urlencoded')

        if '?' in url:
            url, environ['QUERY_STRING'] = url.split('?', 1)
        else:
            environ['QUERY_STRING'] = ''
        if content_type is not None:
            environ['CONTENT_TYPE'] = content_type
        environ['CONTENT_LENGTH'] = str(len(params))
        environ['REQUEST_METHOD'] = method
        environ['wsgi.input'] = BytesIO(to_bytes(params))
        url = self._remove_fragment(url)
        req = self.RequestClass.blank(url, environ)
        if headers:
            req.headers.update(headers)
        return self.do_request(req, status=status,
                               expect_errors=expect_errors)

    def post(self, url, params='', headers=None, extra_environ=None,
             status=None, upload_files=None, expect_errors=False,
             content_type=None):
        """
        Do a POST request.  Very like the ``.get()`` method.
        ``params`` are put in the body of the request.

        ``upload_files`` is for file uploads.  It should be a list of
        ``[(fieldname, filename, file_content)]``.  You can also use
        just ``[(fieldname, filename)]`` and the file content will be
        read from disk.

        For post requests params could be a collections.OrderedDict with
        Upload fields included in order:

            app.post('/myurl', collections.OrderedDict([
                ('textfield1', 'value1'),
                ('uploadfield', webapp.Upload('filename.txt', 'contents'),
                ('textfield2', 'value2')])))

        Returns a ``webob.Response`` object.
        """
        return self._gen_request('POST', url, params=params, headers=headers,
                                 extra_environ=extra_environ, status=status,
                                 upload_files=upload_files,
                                 expect_errors=expect_errors,
                                 content_type=content_type)

    def post_json(self, url, params=NoDefault, headers=None,
                  extra_environ=None, status=None, expect_errors=False):
        """
        Do a POST request.  Very like the ``.get()`` method.
        ``params`` are dumps to json and put in the body of the request.
        Content-Type is set to ``application/json``.

        Returns a ``webob.Response`` object.
        """
        content_type = 'application/json'
        if params is not NoDefault:
            params = dumps(params)
        return self._gen_request('POST', url, params=params, headers=headers,
                                 extra_environ=extra_environ, status=status,
                                 upload_files=None,
                                 expect_errors=expect_errors,
                                 content_type=content_type)

    def put(self, url, params='', headers=None, extra_environ=None,
            status=None, upload_files=None, expect_errors=False,
            content_type=None):
        """
        Do a PUT request.  Very like the ``.post()`` method.
        ``params`` are put in the body of the request, if params is a
        tuple, dictionary, list, or iterator it will be urlencoded and
        placed in the body as with a POST, if it is string it will not
        be encoded, but placed in the body directly.

        Returns a ``webob.Response`` object.
        """
        return self._gen_request('PUT', url, params=params, headers=headers,
                                 extra_environ=extra_environ, status=status,
                                 upload_files=upload_files,
                                 expect_errors=expect_errors,
                                 content_type=content_type)

    def put_json(self, url, params=NoDefault, headers=None, extra_environ=None,
            status=None, expect_errors=False):
        """
        Do a PUT request.  Very like the ``.post()`` method.
        ``params`` are dumps to json and put in the body of the request.
        Content-Type is set to ``application/json``.

        Returns a ``webob.Response`` object.
        """
        content_type = 'application/json'
        if params is not NoDefault:
            params = dumps(params)
        return self._gen_request('PUT', url, params=params, headers=headers,
                                 extra_environ=extra_environ, status=status,
                                 upload_files=None,
                                 expect_errors=expect_errors,
                                 content_type=content_type)

    def delete(self, url, params='', headers=None, extra_environ=None,
               status=None, expect_errors=False, content_type=None):
        """
        Do a DELETE request.  Very like the ``.get()`` method.

        Returns a ``webob.Response`` object.
        """
        if params:
            warnings.warn(('You are not supposed to send a body in a '
                           'DELETE request. Most web servers will ignore it'),
                           lint.WSGIWarning)
        return self._gen_request('DELETE', url, params=params, headers=headers,
                                 extra_environ=extra_environ, status=status,
                                 upload_files=None,
                                 expect_errors=expect_errors,
                                 content_type=content_type)

    def delete_json(self, url, params=NoDefault, headers=None,
                    extra_environ=None, status=None, expect_errors=False):
        """
        Do a DELETE request.  Very like the ``.get()`` method.
        Content-Type is set to ``application/json``.

        Returns a ``webob.Response`` object.
        """
        if params:
            warnings.warn(('You are not supposed to send a body in a '
                           'DELETE request. Most web servers will ignore it'),
                           lint.WSGIWarning)
        content_type = 'application/json'
        if params is not NoDefault:
            params = dumps(params)
        return self._gen_request('DELETE', url, params=params, headers=headers,
                                 extra_environ=extra_environ, status=status,
                                 upload_files=None,
                                 expect_errors=expect_errors,
                                 content_type=content_type)

    def options(self, url, headers=None, extra_environ=None,
               status=None, expect_errors=False):
        """
        Do a OPTIONS request.  Very like the ``.get()`` method.

        Returns a ``webob.Response`` object.
        """
        return self._gen_request('OPTIONS', url, headers=headers,
                                 extra_environ=extra_environ, status=status,
                                 upload_files=None,
                                 expect_errors=expect_errors)

    def head(self, url, headers=None, extra_environ=None,
               status=None, expect_errors=False):
        """
        Do a HEAD request.  Very like the ``.get()`` method.

        Returns a ``webob.Response`` object.
        """
        return self._gen_request('HEAD', url, headers=headers,
                                 extra_environ=extra_environ, status=status,
                                 upload_files=None,
                                 expect_errors=expect_errors)

    def encode_multipart(self, params, files):
        """
        Encodes a set of parameters (typically a name/value list) and
        a set of files (a list of (name, filename, file_body)) into a
        typical POST body, returning the (content_type, body).
        """
        boundary = '----------a_BoUnDaRy%s$' % random.random()
        lines = []

        def _append_value(key, value):
            lines.append('--' + boundary)
            lines.append('Content-Disposition: form-data; name="%s"' % key)
            lines.append('')
            lines.append(value)

        def _append_file(file_info):
            key, filename, value = self._get_file_info(file_info)
            lines.append('--' + boundary)
            lines.append(
                    'Content-Disposition: form-data; name="%s"; filename="%s"'
                    % (key, filename))
            fcontent = mimetypes.guess_type(filename)[0]
            lines.append('Content-Type: %s' %
                         (fcontent or 'application/octet-stream'))
            lines.append('')
            lines.append(value)

        for key, value in params:
            if isinstance(value, File):
                if value.value:
                    _append_file([key] + list(value.value))
            elif isinstance(value, Upload):
                file_info = [key, value.filename]
                if value.file_content is not None:
                    file_info.append(value.file_content)
                _append_file(file_info)
            else:
                _append_value(key, value)

        for file_info in files:
            _append_file(file_info)

        lines.append('--' + boundary + '--')
        lines.append('')
        body = join_bytes('\r\n', lines)
        content_type = 'multipart/form-data; boundary=%s' % boundary
        return content_type, body

    def _get_file_info(self, file_info):
        if len(file_info) == 2:
            # It only has a filename
            filename = file_info[1]
            if self.relative_to:
                filename = os.path.join(self.relative_to, filename)
            f = open(filename, 'rb')
            content = f.read()
            if PY3 and isinstance(content, text_type):
                # we want bytes
                content = content.encode(f.encoding)
            f.close()
            return (file_info[0], filename, content)
        elif len(file_info) == 3:
            content = file_info[2]
            if not isinstance(content, binary_type):
                raise ValueError('File content must be %s not %s'
                        % (binary_type, type(content)))
            return file_info
        else:
            raise ValueError(
                "upload_files need to be a list of tuples of (fieldname, "
                "filename, filecontent) or (fieldname, filename); "
                "you gave: %r"
                % repr(file_info)[:100])

    def request(self, url_or_req, status=None, expect_errors=False,
                **req_params):
        """
        Creates and executes a request.  You may either pass in an
        instantiated :class:`TestRequest` object, or you may pass in a
        URL and keyword arguments to be passed to
        :meth:`TestRequest.blank`.

        You can use this to run a request without the intermediary
        functioning of :meth:`TestApp.get` etc.  For instance, to
        test a WebDAV method::

            resp = app.request('/new-col', method='MKCOL')

        Note that the request won't have a body unless you specify it,
        like::

            resp = app.request('/test.txt', method='PUT', body='test')

        You can use ``POST={args}`` to set the request body to the
        serialized arguments, and simultaneously set the request
        method to ``POST``
        """
        if isinstance(url_or_req, string_types):
            req = self.RequestClass.blank(url_or_req, **req_params)
        else:
            req = url_or_req.copy()
            for name, value in req_params.items():
                setattr(req, name, value)
            if req.content_length == -1:
                req.content_length = len(req.body)
        req.environ['paste.throw_errors'] = True
        for name, value in self.extra_environ.items():
            req.environ.setdefault(name, value)
        return self.do_request(req, status=status, expect_errors=expect_errors)

    def do_request(self, req, status, expect_errors):
        """
        Executes the given request (``req``), with the expected
        ``status``.  Generally ``.get()`` and ``.post()`` are used
        instead.

        To use this::

            resp = app.do_request(webtest.TestRequest.blank(
                'url', ...args...))

        Note you can pass any keyword arguments to
        ``TestRequest.blank()``, which will be set on the request.
        These can be arguments like ``content_type``, ``accept``, etc.
        """
        __tracebackhide__ = True # NOQA
        errors = StringIO()
        req.environ['wsgi.errors'] = errors
        script_name = req.environ.get('SCRIPT_NAME', '')
        if script_name and req.path_info.startswith(script_name):
            req.path_info = req.path_info[len(script_name):]
        cookies = self.cookies or {}
        cookies = list(cookies.items())
        if 'Cookie' in req.headers:
            req_cookies = [i.strip() for i in req.headers['Cookie'].split(';')]
            req_cookies = [i.split('=', 1) for i in req_cookies]
            cookies.extend(req_cookies)
        if cookies:
            cookie_header = ''.join([
                '%s=%s; ' % (name, cookie_quote(value))
                for name, value in cookies])
            req.environ['HTTP_COOKIE'] = cookie_header
        req.environ['paste.testing'] = True
        req.environ['paste.testing_variables'] = {}
        app = lint.middleware(self.app)
        ## FIXME: should it be an option to not catch exc_info?
        res = req.get_response(app, catch_exc_info=True)
        res._use_unicode = self.use_unicode
        res.request = req
        res.app = app
        res.test_app = self
        # We do this to make sure the app_iter is exausted:
        try:
            res.body
        except TypeError:
            pass
        res.errors = errors.getvalue()
        for name, value in req.environ['paste.testing_variables'].items():
            if hasattr(res, name):
                raise ValueError(
                    "paste.testing_variables contains the variable %r, but "
                    "the response object already has an attribute by that "
                    "name" % name)
            setattr(res, name, value)
        if not expect_errors:
            self._check_status(status, res)
            self._check_errors(res)
        res.cookies_set = {}
        for header in res.headers.getall('set-cookie'):
            try:
                c = SimpleCookie(header)
            except CookieError:
                raise CookieError(
                    "Could not parse cookie header %r" % (header,))
            for key, morsel in c.items():
                self.cookies[key] = morsel.value
                res.cookies_set[key] = morsel.value
        return res

    def _check_status(self, status, res):
        __tracebackhide__ = True # NOQA
        if status == '*':
            return
        res_status = to_string(res.status)
        if (isinstance(status, string_types)
            and '*' in status):
            if re.match(fnmatch.translate(status), res_status, re.I):
                return
        if isinstance(status, (list, tuple)):
            if res.status_int not in status:
                raise AppError(
                    "Bad response: %s (not one of %s for %s)\n%s",
                    res_status, ', '.join(map(str, status)),
                    res.request.url, res)
            return
        if status is None:
            if res.status_int >= 200 and res.status_int < 400:
                return
            raise AppError(
                "Bad response: %s (not 200 OK or 3xx redirect for %s)\n%s",
                res_status, res.request.url,
                res)
        if status != res.status_int:
            raise AppError(
                "Bad response: %s (not %s)", res_status, status)

    def _check_errors(self, res):
        errors = res.errors
        if errors:
            raise AppError(
                "Application had errors logged:\n%s", errors)


########################################
## Form objects
########################################


_attr_re = re.compile(
        (r'([^= \n\r\t]+)[ \n\r\t]*(?:=[ \n\r\t]*(?:"([^"]*)"|\'([^\']*)'
         r'\'|([^"\'][^ \n\r\t>]*)))?'), re.S)


def _parse_attrs(text):
    attrs = {}
    for match in _attr_re.finditer(text):
        attr_name = match.group(1).lower()
        attr_body = match.group(2) or match.group(3)
        attr_body = html_unquote(attr_body or '')
        # python <= 2.5 doesn't like **dict when the keys are unicode
        # so cast str on them. Unicode field attributes are not
        # supported now (actually they have never been supported).
        attrs[str(attr_name)] = attr_body
    return attrs


class Upload(object):
    def __init__(self, filename, file_content=None):
        self.filename = filename
        self.file_content = file_content


class Field(object):

    """
    Field object.
    """

    # Dictionary of field types (select, radio, etc) to classes
    classes = {}

    settable = True

    def __init__(self, form, tag, name, pos,
                 value=None, id=None, **attrs):
        self.form = form
        self.tag = tag
        self.name = name
        self.pos = pos
        self._value = value
        self.id = id
        self.attrs = attrs

    def value__set(self, value):
        if not self.settable:
            raise AttributeError(
                "You cannot set the value of the <%s> field %r"
                % (self.tag, self.name))
        self._value = value

    def force_value(self, value):
        """
        Like setting a value, except forces it even for, say, hidden
        fields.
        """
        self._value = value

    def value__get(self):
        return self._value

    value = property(value__get, value__set)

    def __repr__(self):
        value = '<%s name="%s"' % (self.__class__.__name__, self.name)
        if self.id:
            value += ' id="%s"' % self.id
        return value + '>'


class NoValue(object):
    pass


class Select(Field):

    """
    Field representing ``<select>``
    """

    def __init__(self, *args, **attrs):
        super(Select, self).__init__(*args, **attrs)
        self.options = []
        # Undetermined yet:
        self.selectedIndex = None
        # we have no forced value
        self._forced_value = NoValue

    def force_value(self, value):
        self._forced_value = value

    def value__set(self, value):
        if self._forced_value is not NoValue:
            self._forced_value = NoValue
        for i, (option, checked) in enumerate(self.options):
            if option == _stringify(value):
                self.selectedIndex = i
                break
        else:
            raise ValueError(
                "Option %r not found (from %s)"
                % (value, ', '.join(
                [repr(o) for o, c in self.options])))

    def value__get(self):
        if self._forced_value is not NoValue:
            return self._forced_value
        elif self.selectedIndex is not None:
            return self.options[self.selectedIndex][0]
        else:
            for option, checked in self.options:
                if checked:
                    return option
            else:
                if self.options:
                    return self.options[0][0]
                else:
                    return None

    value = property(value__get, value__set)

Field.classes['select'] = Select


class MultipleSelect(Field):

    """
    Field representing ``<select multiple="multiple">``
    """

    def __init__(self, *args, **attrs):
        super(MultipleSelect, self).__init__(*args, **attrs)
        self.options = []
        # Undetermined yet:
        self.selectedIndices = []
        self._forced_values = []

    def force_value(self, values):
        self._forced_values = values
        self.selectedIndices = []

    def value__set(self, values):
        str_values = [_stringify(value) for value in values]
        self.selectedIndices = []
        for i, (option, checked) in enumerate(self.options):
            if option in str_values:
                self.selectedIndices.append(i)
                str_values.remove(option)
        if str_values:
            raise ValueError(
                "Option(s) %r not found (from %s)"
                % (', '.join(str_values),
                   ', '.join(
                        [repr(o) for o, c in self.options])))

    def value__get(self):
        selected_values = []
        if self.selectedIndices:
            selected_values = [self.options[i][0] \
                                    for i in self.selectedIndices]
        elif not self._forced_values:
            selected_values = []
            for option, checked in self.options:
                if checked:
                    selected_values.append(option)
        if self._forced_values:
            selected_values += self._forced_values

        if self.options and (not selected_values):
            selected_values = None
        return selected_values
    value = property(value__get, value__set)

Field.classes['multiple_select'] = MultipleSelect


class Radio(Select):

    """
    Field representing ``<input type="radio">``
    """

    def value__get(self):
        if self._forced_value is not NoValue:
            self._forced_value = NoValue
        if self.selectedIndex is not None:
            return self.options[self.selectedIndex][0]
        else:
            for option, checked in self.options:
                if checked:
                    return option
            else:
                return None

    value = property(value__get, Select.value__set)

Field.classes['radio'] = Radio


class Checkbox(Field):

    """
    Field representing ``<input type="checkbox">``
    """

    def __init__(self, *args, **attrs):
        super(Checkbox, self).__init__(*args, **attrs)
        self.checked = 'checked' in attrs

    def value__set(self, value):
        self.checked = not not value

    def value__get(self):
        if self.checked:
            if self._value is None:
                return 'on'
            else:
                return self._value
        else:
            return None

    value = property(value__get, value__set)

Field.classes['checkbox'] = Checkbox


class Text(Field):
    """
    Field representing ``<input type="text">``
    """

    def value__get(self):
        if self._value is None:
            return ''
        else:
            return self._value

    value = property(value__get, Field.value__set)

Field.classes['text'] = Text


class File(Field):
    """
    Field representing ``<input type="file">``
    """

    ## FIXME: This doesn't actually handle file uploads and enctype
    def value__get(self):
        if self._value is None:
            return ''
        else:
            return self._value

    value = property(value__get, Field.value__set)

Field.classes['file'] = File


class Textarea(Text):
    """
    Field representing ``<textarea>``
    """

Field.classes['textarea'] = Textarea


class Hidden(Text):
    """
    Field representing ``<input type="hidden">``
    """

Field.classes['hidden'] = Hidden


class Submit(Field):
    """
    Field representing ``<input type="submit">`` and ``<button>``
    """

    settable = False

    def value__get(self):
        return None

    value = property(value__get)

    def value_if_submitted(self):
        return self._value

Field.classes['submit'] = Submit

Field.classes['button'] = Submit

Field.classes['image'] = Submit


class Form(object):

    """
    This object represents a form that has been found in a page.
    This has a couple useful attributes:

    ``text``:
        the full HTML of the form.

    ``action``:
        the relative URI of the action.

    ``method``:
        the method (e.g., ``'GET'``).

    ``id``:
        the id, or None if not given.

    ``fields``:
        a dictionary of fields, each value is a list of fields by
        that name.  ``<input type=\"radio\">`` and ``<select>`` are
        both represented as single fields with multiple options.
    """

    # @@: This really should be using Mechanize/ClientForm or
    # something...

    _tag_re = re.compile(r'<(/?)([a-z0-9_\-]*)([^>]*?)>', re.I)
    _label_re = re.compile(
            '''<label\s+(?:[^>]*)for=(?:"|')([a-z0-9_\-]+)(?:"|')(?:[^>]*)>''',
            re.I)

    FieldClass = Field

    def __init__(self, response, text):
        self.response = response
        self.text = text
        self._parse_fields()
        self._parse_action()

    def _parse_fields(self):
        in_select = None
        in_textarea = None
        fields = OrderedDict()
        field_order = []
        for match in self._tag_re.finditer(self.text):
            end = match.group(1) == '/'
            tag = match.group(2).lower()
            if tag not in ('input', 'select', 'option', 'textarea',
                           'button'):
                continue
            if tag == 'select' and end:
                assert in_select, (
                    '%r without starting select' % match.group(0))
                in_select = None
                continue
            if tag == 'textarea' and end:
                assert in_textarea, (
                    "</textarea> with no <textarea> at %s" % match.start())
                in_textarea[0].value = html_unquote(
                                    self.text[in_textarea[1]:match.start()])
                in_textarea = None
                continue
            if end:
                continue
            attrs = _parse_attrs(match.group(3))
            if 'name' in attrs:
                name = attrs.pop('name')
            else:
                name = None
            if tag == 'option':
                in_select.options.append((attrs.get('value'),
                                          'selected' in attrs))
                continue
            if tag == 'input' and attrs.get('type') == 'radio':
                field = fields.get(name)
                if not field:
                    field = self.FieldClass.classes['radio'](
                                       self, tag, name, match.start(), **attrs)
                    fields.setdefault(name, []).append(field)
                    field_order.append((name, field))
                else:
                    field = field[0]
                    assert isinstance(field, self.FieldClass.classes['radio'])
                field.options.append((attrs.get('value'),
                                      'checked' in attrs))
                continue
            tag_type = tag
            if tag == 'input':
                tag_type = attrs.get('type', 'text').lower()
            if tag_type == "select" and attrs.get("multiple"):
                FieldClass = self.FieldClass.classes.get("multiple_select",
                                                         self.FieldClass)
            else:
                FieldClass = self.FieldClass.classes.get(tag_type,
                                                         self.FieldClass)
            field = FieldClass(self, tag, name, match.start(), **attrs)
            if tag == 'textarea':
                assert not in_textarea, (
                    "Nested textareas: %r and %r"
                    % (in_textarea, match.group(0)))
                in_textarea = field, match.end()
            elif tag == 'select':
                assert not in_select, (
                    "Nested selects: %r and %r"
                    % (in_select, match.group(0)))
                in_select = field
            fields.setdefault(name, []).append(field)
            field_order.append((name, field))
        self.field_order = field_order
        self.fields = fields

    def _parse_action(self):
        self.action = None
        for match in self._tag_re.finditer(self.text):
            end = match.group(1) == '/'
            tag = match.group(2).lower()
            if tag != 'form':
                continue
            if end:
                break
            attrs = _parse_attrs(match.group(3))
            self.action = attrs.get('action', '')
            self.method = attrs.get('method', 'GET')
            self.id = attrs.get('id')
            self.enctype = attrs.get('enctype',
                                     'application/x-www-form-urlencoded')
        else:
            assert 0, "No </form> tag found"
        assert self.action is not None, (
            "No <form> tag found")

    def __setitem__(self, name, value):
        """
        Set the value of the named field.  If there is 0 or multiple
        fields by that name, it is an error.

        Setting the value of a ``<select>`` selects the given option
        (and confirms it is an option).  Setting radio fields does the
        same.  Checkboxes get boolean values.  You cannot set hidden
        fields or buttons.

        Use ``.set()`` if there is any ambiguity and you must provide
        an index.
        """
        fields = self.fields.get(name)
        assert fields is not None, (
            "No field by the name %r found (fields: %s)"
            % (name, ', '.join(map(repr, self.fields.keys()))))
        assert len(fields) == 1, (
            "Multiple fields match %r: %s"
            % (name, ', '.join(map(repr, fields))))
        fields[0].value = value

    def __getitem__(self, name):
        """
        Get the named field object (ambiguity is an error).
        """
        fields = self.fields.get(name)
        assert fields is not None, (
            "No field by the name %r found" % name)
        assert len(fields) == 1, (
            "Multiple fields match %r: %s"
            % (name, ', '.join(map(repr, fields))))
        return fields[0]

    def lint(self):
        """Check that the html is valid:

        - each field must have an id
        - each field must have a label
        """
        labels = self._label_re.findall(self.text)
        for name, fields in self.fields.items():
            for field in fields:
                if not isinstance(field, (Submit, Hidden)):
                    if not field.id:
                        raise AttributeError(
                             "%r as no id attribute" % field)
                    elif field.id not in labels:
                        raise AttributeError(
                             "%r as no associated label" % field)

    def set(self, name, value, index=None):
        """
        Set the given name, using ``index`` to disambiguate.
        """
        if index is None:
            self[name] = value
        else:
            fields = self.fields.get(name)
            assert fields is not None, (
                "No fields found matching %r" % name)
            field = fields[index]
            field.value = value

    def get(self, name, index=None, default=NoDefault):
        """
        Get the named/indexed field object, or ``default`` if no field
        is found.
        """
        fields = self.fields.get(name)
        if fields is None and default is not NoDefault:
            return default
        if index is None:
            return self[name]
        else:
            fields = self.fields.get(name)
            assert fields is not None, (
                "No fields found matching %r" % name)
            field = fields[index]
            return field

    def select(self, name, value, index=None):
        """
        Like ``.set()``, except also confirms the target is a
        ``<select>``.
        """
        field = self.get(name, index=index)
        assert isinstance(field, Select)
        field.value = value

    def submit(self, name=None, index=None, **args):
        """
        Submits the form.  If ``name`` is given, then also select that
        button (using ``index`` to disambiguate)``.

        Any extra keyword arguments are passed to the ``.get()`` or
        ``.post()`` method.

        Returns a :class:`webtest.TestResponse` object.
        """
        fields = self.submit_fields(name, index=index)
        if self.method.upper() != "GET":
            args.setdefault("content_type",  self.enctype)
        return self.response.goto(self.action, method=self.method,
                                  params=fields, **args)

    def upload_fields(self):
        """
        Return a list of file field tuples of the form:
            (field name, file name)
        or
            (field name, file name, file contents).
        """
        uploads = []
        for name, fields in self.fields.items():
            for field in fields:
                if isinstance(field, File) and field.value:
                    uploads.append([name] + list(field.value))
        return uploads

    def submit_fields(self, name=None, index=None):
        """
        Return a list of ``[(name, value), ...]`` for the current
        state of the form.
        """
        submit = []
        # Use another name here so we can keep function param the same for BWC.
        submit_name = name
        if index is None:
            index = 0
        # This counts all fields with the submit name not just submit fields.
        current_index = 0
        for name, field in self.field_order:
            if name is None:
                continue
            if submit_name is not None and name == submit_name and \
                current_index == index:
                submit.append((name, field.value_if_submitted()))
            elif submit_name is not None and name == submit_name:
                current_index += 1
            else:
                value = field.value
                if value is None:
                    continue
                if isinstance(field, File):
                    submit.append((name, field))
                    continue
                if isinstance(value, list):
                    for item in value:
                        submit.append((name, item))
                else:
                    submit.append((name, value))
        return submit

    def __repr__(self):
        value = '<Form'
        if self.id:
            value += ' id=%r' % str(self.id)
        return value + ' />'

########################################
## Utility functions
########################################


def _stringify(value):
    if isinstance(value, text_type):
        return value
    return str(value)


def _popget(d, key, default=None):
    """
    Pop the key if found (else return default)
    """
    if key in d:
        return d.pop(key)
    return default


def _space_prefix(pref, full, sep=None, indent=None, include_sep=True):
    """
    Anything shared by pref and full will be replaced with spaces
    in full, and full returned.
    """
    if sep is None:
        sep = os.path.sep
    pref = pref.split(sep)
    full = full.split(sep)
    padding = []
    while pref and full and pref[0] == full[0]:
        if indent is None:
            padding.append(' ' * (len(full[0]) + len(sep)))
        else:
            padding.append(' ' * indent)
        full.pop(0)
        pref.pop(0)
    if padding:
        if include_sep:
            return ''.join(padding) + sep + sep.join(full)
        else:
            return ''.join(padding) + sep.join(full)
    else:
        return sep.join(full)


def _make_pattern(pat):
    if pat is None:
        return None
    if isinstance(pat, string_types):
        pat = re.compile(pat)
    if hasattr(pat, 'search'):
        return pat.search
    if hasattr(pat, '__call__'):
        return pat
    assert 0, (
        "Cannot make callable pattern object out of %r" % pat)


def html_unquote(v):
    """
    Unquote (some) entities in HTML.  (incomplete)
    """
    for ent, repl in [('&nbsp;', ' '), ('&gt;', '>'),
                      ('&lt;', '<'), ('&quot;', '"'),
                      ('&amp;', '&')]:
        v = v.replace(ent, repl)
    return v


def encode_params(params, content_type):
    if params is NoDefault:
        return ''
    if isinstance(params, dict) or hasattr(params, 'items'):
        params = list(params.items())
    if isinstance(params, (list, tuple)):
        if content_type:
            content_type = content_type.lower()
            if 'charset=' in content_type:
                charset = content_type.split('charset=')[1]
                charset = charset.strip('; ').lower()
                encoded_params = []
                for k, v in params:
                    if isinstance(v, text_type):
                        v = v.encode(charset)
                    encoded_params.append((k, v))
                params = encoded_params
        params = urlencode(params, doseq=True)
    return params
