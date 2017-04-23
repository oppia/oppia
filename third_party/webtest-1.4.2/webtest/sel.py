# (c) 2005 Ian Bicking and contributors; written for Paste
# (http://pythonpaste.org)
# Licensed under the MIT license:
# http://www.opensource.org/licenses/mit-license.php
"""
Routines for testing WSGI applications with selenium.

Most interesting is :class:`~webtest.sel.SeleniumApp` and the
:func:`~webtest.sel.selenium` decorator
"""
import os
import cgi
import sys
import time
import signal
import socket
import types
import webob
import logging
import warnings
import tempfile
import unittest
import threading
import subprocess
from functools import wraps
from webtest import app as testapp
from wsgiref import simple_server
from contextlib import contextmanager
from webtest.compat import PY3
from webtest.compat import urlencode
from webtest.compat import binary_type
from webtest.compat import HTTPConnection
from webtest.compat import CannotSendRequest
from webtest.compat import HTTPServer
from webtest.compat import SimpleHTTPRequestHandler

try:
    import json
except ImportError:
    try:
        import simplejson as json  # NOQA
    except:
        json = False


try:
    unicode()
except NameError:
    unicode = str

log = logging.getLogger(__name__)


if 'SELENIUM_VERBOSE':
    log.addHandler(logging.StreamHandler(sys.stderr))
    log.setLevel(logging.DEBUG)


class SeleniumWarning(Warning):
    """Specific warning category"""

HAS_UPLOAD_SUPPORT = ('*chrome', '*firefox')

############
# Decorator
############


def function_decorator(func):
    """run test with selenium. create a new session if needed"""
    @wraps(func)
    def wrapper(*args):
        if is_available():
            if args and isinstance(args[0], unittest.TestCase):
                self = args[0]
                if isinstance(self.app, SeleniumApp):
                    func(self)
                else:
                    old_app = self.app
                    self.app = SeleniumApp(self.app.app)
                    try:
                        func(self)
                    finally:
                        self.app.close()
                        self.app = old_app
            else:
                # function
                func(*args)
    return wrapper


def context_manager(resp):
    """A context mamanger to create a session inside a test"""
    resp.updated = False
    if not is_available():
        yield None
    else:
        test_app = resp.test_app
        app = SeleniumApp(test_app.app)
        for h, v in resp.request.headers.items():
            if h.lower() not in ('host',):
                app.browser.addCustomRequestHeader(h, v)
        fd = tempfile.NamedTemporaryFile(prefix='webtest-selenium-',
                                         suffix='.html')
        fd.write(resp.body)
        fd.flush()
        response = app.get('/__file__', dict(__file__=fd.name))
        try:
            yield response
        finally:
            body = app.browser.getHtmlSource()
            if PY3:
                body = body.encode(resp.charset or 'utf-8')
            resp.body = body
            resp._forms_indexed = None
            resp.updated = True
            app.close()
            fd.close()


def selenium(obj):
    """A callable usable as:

    - class decorator
    - function decorator
    - contextmanager
    """
    if isinstance(obj, type):
        if is_available():
            return obj
    elif isinstance(obj, types.FunctionType):
        return function_decorator(obj)
    elif isinstance(obj, testapp.TestResponse):
        return contextmanager(context_manager)(obj)
    else:
        raise RuntimeError('Unsuported type %r' % obj)


class Selenium(object):
    """Selenium RC control aka ``browser``

    A object use to manipulate DOM nodes. This object allow to use the
    underlying selenium api. See Selenium `api
    <http://goo.gl/IecEk>`_

    You can use the original method name::

        browser.fireEvent('id=#myid", 'focus')

    Or a more pythonic name::

        browser.fire_event('id=#myid", 'focus')

    Both are equal to::

        browser.execute('fireEvent', 'id=#myid', 'focus')

    """

    def __init__(self):
        self.host = os.environ.get('SELENIUM_HOST', '127.0.0.1')
        self.port = int(os.environ.get('SELENIUM_PORT', 4444))
        self.session_id = None

    def start(self, url):
        self.driver = os.environ.get('SELENIUM_DRIVER',
                                      '*googlechrome')
        self.session_id = self.getNewBrowserSession(
                                       self.driver, url, '',
                                       "captureNetworkTraffic=true",
                                       "addCustomRequestHeader=true")

    def stop(self):
        self.testComplete()
        self.session_id = None

    def execute(self, cmd, *args):
        data = dict([(i + 1, a) for i, a in enumerate(args)], cmd=cmd)
        if self.session_id:
            data['sessionId'] = self.session_id
        data = urlencode(data)
        headers = {
            "Content-Type": "application/x-www-form-urlencoded; charset=utf-8"
          }
        conn = HTTPConnection(self.host, self.port)
        try:
            conn.request("POST", "/selenium-server/driver/", data, headers)
            resp = conn.getresponse()
            data = resp.read()
        finally:
            conn.close()
        if PY3:
            data = str(data, 'utf-8')
        if data.startswith('ERROR: Unknown command:'):
            raise AttributeError(repr(data))
        elif not data.startswith('OK'):
            raise RuntimeError(repr(data))
        data = data[3:]
        if data in ('true', 'false'):
            return data == 'true' and True or False
        return data

    def __getattr__(self, attr):
        cmd = _get_command(attr)

        def wrapped(*args):
            args = [cmd] + [str(a) for a in args]
            return self.execute(*args)

        wrapped.__name__ = attr
        return wrapped


##############
# Webtest API
##############


class SeleniumApp(testapp.TestApp):
    """See :class:`webtest.TestApp`

    SeleniumApp only support ``GET`` requests
    """

    apps = []

    def __init__(self, app=None, url=None, timeout=30000,
                 extra_environ=None, relative_to=None, **kwargs):
        self.app = None
        if app:
            super(SeleniumApp, self).__init__(app, relative_to=relative_to)
            self._run_server(self.app)
            url = self.app.url
        assert is_available()
        self.session_id = None
        self._browser = Selenium()
        self._browser.start(url)
        self.extra_environ = extra_environ or {}
        self.timeout = timeout
        self.test_app = self

    @property
    def browser(self):
        """The current :class:`~webtest.sel.Selenium`"""
        return self._browser

    @property
    def has_upload_support(self):
        return self._browser.driver in HAS_UPLOAD_SUPPORT

    def do_request(self, req, status, expect_errors):
        if req.method != 'GET':
            raise testapp.AppError('Only GET are allowed')
        if self.app:
            req.host = '%s:%s' % self.app.bind
        self.browser.captureNetworkTraffic('json')
        for h, v in req.headers.items():
            if h.lower() not in ('host',):
                self.browser.addCustomRequestHeader(h, v)
        self.browser.open(req.url)
        resp = self._get_response()
        if not expect_errors:
            self._check_status(status, resp)
            if not status:
                status = resp.status_int
                if not (status > 300 and status < 400):
                    self._check_errors(resp)
        return resp

    def _get_response(self, resp=None, timeout=None):
        """Get responses responses from selenium"""
        if timeout != 0:
            timeout = timeout or self.timeout
            self.browser.waitForPageToLoad(timeout)
        trafic = json.loads(self.browser.captureNetworkTraffic('json'))
        responses = []
        errors = []
        for d in trafic:
            if d['url'].endswith('.ico'):
                continue
            req = webob.Request.blank(d['url'])
            for h in d['requestHeaders']:
                req.headers[h['name']] = h['value']
            resp = TestResponse()
            resp.app = resp.test_app = self.test_app
            resp.browser = self.test_app.browser
            resp.responses = responses
            resp.errors = errors
            resp.request = req
            resp.status = str(d['statusCode'])
            for h in d['responseHeaders']:
                resp.headers[h['name']] = h['value']
            if resp.status_int == 200 and 'text/' in resp.content_type:
                if not resp.charset:
                    resp.charset = 'utf-8'
            if resp.status_int > 400:
                errors.append('%s %r' % (resp.request.url, resp))
            if 'html' in resp.content_type or resp.status_int != 200:
                responses.append(resp)
        if responses:
            resp = responses.pop(0)
            return resp
        elif resp is not None:
            return resp
        else:
            raise LookupError('No response found')

    def _run_server(self, app):
        """Run a wsgi server in a separate thread"""
        ip, port = _free_port()
        self.app = app = WSGIApplication(app, (ip, port))

        def run():
            httpd = simple_server.make_server(
                            ip, port, app,
                            server_class=WSGIServer,
                            handler_class=WSGIRequestHandler)
            httpd.serve_forever()

        app.thread = threading.Thread(target=run)
        app.thread.start()
        conn = HTTPConnection(ip, port)
        time.sleep(.5)
        for i in range(100):
            try:
                conn.request('GET', '/__application__')
                conn.getresponse()
            except (socket.error, CannotSendRequest):
                time.sleep(.3)
            else:
                break

    def close(self):
        """Close selenium and the WSGI server if needed"""
        if self.app:
            conn = HTTPConnection(*self.app.bind)
            for i in range(100):
                try:
                    conn.request('GET', '/__kill_application__')
                    conn.getresponse()
                except socket.error:
                    conn.close()
                    break
                else:
                    time.sleep(.3)
        if 'SELENIUM_KEEP_OPEN' not in os.environ:
            self.browser.stop()
        if 'SELENIUM_PID' in os.environ:
            os.kill(int(os.environ['SELENIUM_PID']), signal.SIGTERM)


class TestResponse(testapp.TestResponse):

    def follow(self, status=None, **kw):
        """If this request is a redirect, follow that redirect.  It
        is an error if this is not a redirect response.  Returns
        another response object.
        """
        if not (self.status_int >= 300 and self.status_int < 400):
            raise ValueError(
               'You can only follow 301 and 302. Not %s' % self.status_int)
        if len(self.responses):
            resp = self.responses[0]
            if not kw.get('expect_errors', False):
                self.app._check_status(status, resp)
                if not status:
                    self.app._check_errors(resp)
            return self.responses.pop(0)
        raise LookupError('Responses queue is empty. Nothing to follow.')

    def click(self, description=None, linkid=None, href=None,
              anchor=None, index=None, verbose=False,
              extra_environ=None, timeout=None):
        link = self.doc.link(description=description, linkid=linkid,
                             href=href, index=index)
        link.click()
        if timeout == 0:
            return self
        return self.test_app._get_response(resp=self, timeout=timeout)

    @property
    def forms(self):
        return Forms(self)

    @property
    def form(self):
        return Form(self, 0)

    def _body__get(self):
        body = self.browser.getHtmlSource()
        if PY3:
            return body.encode(self.charset or 'utf-8')
        if isinstance(body, binary_type):
            return unicode(body, self.charset or 'utf-8')
        else:
            return body

    body = property(_body__get)

    def __contains__(self, item):
        if isinstance(item, Element):
            return item.isElementPresent()
        return super(TestResponse, self).__contains__(item)

    @property
    def doc(self):
        """Expose a :class:`~webtest.browser.Document`"""
        return Document(self)


##########
# DOM
##########


class Element(object):
    """A object use to manipulate DOM nodes. This object allow to use the
    underlying selenium api for the specified locator. See Selenium `api
    <http://goo.gl/IecEk>`_

    You can use the original method name::

        element.fireEvent('focus')

    Or a more pythonic name::

        element.fire_event('focus')

    Both are equal to::

        browser.execute('fireEvent', element.locator, 'focus')

    """

    def __init__(self, resp, locator):
        self.browser = resp.browser
        self.resp = resp
        self.locator = locator

    def __getattr__(self, attr):
        cmd = _get_command(attr)

        def wrapped(*args):
            args = [cmd, self.locator] + [str(a) for a in args]
            return self.browser.execute(*args)
        wrapped.__name__ = attr

        return wrapped

    def exist(self):
        """return true is the element is present"""
        return self.isElementPresent()

    def wait(self, timeout=3000):
        """Wait for an element and return this element"""
        script = "selenium.isElementPresent(%r) || null" % str(self)
        try:
            self.browser.waitForCondition(script, timeout)
        except RuntimeError:
            raise RuntimeError("Can't find %s after %sms" % (self, timeout))
        return self

    def wait_and_click(self, timeout=3000):
        """Wait for an element, click on it and return this element"""
        return self.wait().click()

    def hasClass(self, name):
        """True iif the class is present"""
        classes = self.attr('class').split()
        return name in classes

    def html(self):
        """Return the innerHTML of the element"""
        return self.eval('e.innerHTML')

    def text(self):
        """Return the text of the element"""
        return self.getText()

    def attr(self, attr):
        """Return the attribute value of the element"""
        return self.eval('e.getAttribute(%r)' % str(attr))

    def drag_and_drop(self, element):
        """Drag and drop to element"""
        return self.dragAndDropToObject(element)

    def value__get(self):
        return self.getValue()

    def value__set(self, value):
        value = _get_value(value)
        script = """(function() {
        s.doFireEvent(l, "focus");
        s.doType(l, %s);
        e.setAttribute("value", %s);
        s.doFireEvent(l, "keydown");
        s.doFireEvent(l, "keypress");
        s.doFireEvent(l, "keyup");
        }())""" % (value, value)
        self.eval(script)

    value = property(value__get, value__set)

    def eval(self, *expr):
        """Eval a javascript expression in Selenium RC. You can use the
        following variables:

        - s: the ``selenium`` object
        - b: the ``browserbot`` object
        - l: the element locator string
        - e: the element itself
        """
        script = (
        "(function(s) {"
            "var l = %r;"
            "var b = s.browserbot; var e = b.findElement(l);"
            "var res = %s; return res || 'null';"
        "}(this))"
        ) % (str(self), ''.join(expr).strip(';'))
        try:
            return self.browser.getEval(script)
        except RuntimeError:
            raise RuntimeError(script)

    def __contains__(self, s):
        if isinstance(s, Element):
            s = s.html()
        return s in self.html()

    def __nonzero__(self):
        return self.exist()
    __bool__ = __nonzero__

    def __repr__(self):
        return '<%s at %s>' % (self.__class__.__name__, self.locator)

    def __str__(self):
        return str(self.locator.replace('"', "'"))


class Document(object):
    """The browser document. ``resp.doc.myid`` is egual to
    ``resp.doc.css('#myid')``"""

    def __init__(self, resp):
        self.resp = resp

    def __getattr__(self, attr):
        return Element(self.resp, 'css=#%s' % attr)

    def get(self, tag, **kwargs):
        """Return an element matching ``tag``, an ``attribute`` and an
        ``index``.  For example::

          resp.doc.get('input', name='go') => xpath=//input[@name="go"]
          resp.doc.get('li', description='Item') => xpath=//li[.="Item"]
        """
        locator = _eval_xpath(tag, **kwargs)
        return Element(self.resp, locator)

    def xpath(self, path):
        """Get an :class:`~webtest.browser.Element` using xpath"""
        return Element(self.resp, 'xpath=%s' % path)

    def css(self, selector):
        """Get an :class:`~webtest.browser.Element` using a css selector"""
        return Element(self.resp, 'css=%s' % selector)

    def link(self, description=None, linkid=None, href=None, index=None):
        """Get a link"""
        return self.get('a', description=description, id=linkid,
                             href=href, index=index)

    def input(self, value=None, name=None, inputid=None, index=None):
        """Get an input field"""
        return self.get('input', id=inputid,
                                 value=value, name=name, index=index)

    def button(self, description=None, buttonid=None, index=None):
        """Get a button"""
        return self.get('button', description=description,
                                 id=buttonid, index=index)

    def __contains__(self, s):
        if isinstance(s, Element):
            return s.exist()
        return self.browser.isTextPresent(_get_value(s))

    def __call__(self, locator):
        return Element(locator)


###########
# Forms
###########


class Field(testapp.Field, Element):

    classes = {}

    def __init__(self, *args, **kwargs):
        super(Field, self).__init__(*args, **kwargs)
        self.browser = self.form.browser
        self.options = []
        self.selectedIndices = []
        self._forced_values = []
        self.locator = _eval_xpath(self.tag,
                                   locator=self.form.locator,
                                    name=self.name)

    value = property(Element.value__get, Element.value__set)


class Select(Field):
    """Field representing ``<select>``"""

    def force_value(self, value):
        self.select('value=%s' % value)

    def value__set(self, value):
        self.select('value=%s' % value)

    def value__get(self):
        return self.getSelectedValue()

    value = property(value__get, value__set)

Field.classes['select'] = Select


class MultipleSelect(Field):
    """Field representing ``<select multiple="multiple">``"""

    def force_value(self, values):
        self.removeAllSelections()
        str_values = [testapp._stringify(value) for value in values]
        for v in str_values:
            self.addSelection('value=%s' % v)

    def value__set(self, values):
        self.removeAllSelections()
        str_values = [testapp._stringify(value) for value in values]
        for v in str_values:
            self.addSelection('value=%s' % v)

    def value__get(self):
        value = self.getSelectedValues()
        return value.split(',')

    value = property(value__get, value__set)

Field.classes['multiple_select'] = MultipleSelect


class Radio(Field):
    """Field representing ``<input type="radio">``"""

    def value__set(self, value):
        if value:
            self.check()
        else:
            self.uncheck()

    def value__get(self):
        script = r"""(function(obj) {
            var name = '%s';
            var element = obj.browserbot.findElement('%s');
            var elements = element.getElementsByTagName('input');
            var values = [];
            for (var i = 0, n = elements.length; i < n; ++i) {
                element = elements[i];
                if (element.name == name && element.checked) {
                    values.push('name='+element.value);
                }
            }
            return values.join('&');
        }(this))""" % (self.name, self.form.locator)
        value = self.browser.getEval(script)
        value = [v for k, v in cgi.parse_qsl('name=true')]
        if not value:
            return None
        elif len(value) == 1:
            return value[0]
        raise ValueError(
                'Got more than one value for %r: %s' % (self, value))

    value = property(value__get, value__set)


Field.classes['radio'] = Radio


class Checkbox(Radio):
    """Field representing ``<input type="checkbox">``"""

Field.classes['checkbox'] = Checkbox


class Text(Field):
    """Field representing ``<input type="text">``"""

Field.classes['text'] = Text


class File(Field):
    """Field representing ``<input type="file">``"""

    def _run_server(self, filename):
        """Run a simple server in a separate thread"""
        ip, port = _free_port()

        def run():
            FileHandler.filename = filename
            server = HTTPServer((ip, port), FileHandler)
            server.handle_request()

        thread = threading.Thread(target=run)
        thread.start()
        return 'http://%s:%s/' % (ip, port)

    def value__set(self, value):
        if isinstance(value, (list, tuple)) and len(value) == 1:
            value = [self.name] + list(value)
        test_app = self.form.resp.test_app
        file_info = test_app._get_file_info(value)
        name, filename, content = file_info
        if test_app.has_upload_support:
            url = self._run_server(filename)
            url += os.path.basename(filename)
            self.attachFile(url)

    force_value = value__set

    value = property(Field.value__get, value__set)

Field.classes['file'] = File


class Textarea(Text):
    """Field representing ``<textarea>``"""

Field.classes['textarea'] = Textarea


class Hidden(Text, testapp.Hidden):
    """Field representing ``<input type="hidden">``"""

Field.classes['hidden'] = Hidden


class Submit(Field, testapp.Submit):
    """Field representing ``<input type="submit">`` and ``<button>``"""

    settable = False

    def value__get(self):
        return None

    value = property(value__get)

    def value_if_submitted(self):
        return self._value

Field.classes['submit'] = Submit

Field.classes['button'] = Submit

Field.classes['image'] = Submit


class Forms(object):

    def __init__(self, resp):
        self.resp = resp

    def __getitem__(self, key):
        return Form(self.resp, key)


class Form(testapp.Form, Element):
    """See :class:`~webtest.Form`"""

    FieldClass = Field

    def __init__(self, resp, id):
        self.resp = resp
        self.test_app = resp.test_app
        self.browser = resp.browser
        if isinstance(id, int):
            self.locator = _eval_xpath('form', index=id)
        else:
            self.locator = _eval_xpath('form', id=id)
        if not self:
            raise LookupError('No form found at %s' % self.locator)
        form = self.eval('e.innerHTML')
        super(Form, self).__init__(resp, '<form>%s</form>' % form)

    def _parse_fields(self):
        super(Form, self)._parse_fields()
        # Add index to locators
        for name, fields in self.fields.items():
            if len(fields) > 1:
                for i, field in enumerate(fields):
                    field.locator += '[%s]' % (i + 1,)

    def submit(self, name=None, index=None, extra_environ=None, timeout=None):
        """Submits the form.  If ``name`` is given, then also select that
        button (using ``index`` to disambiguate)``.

        Returns a :class:`webtest.browser.TestResponse` object.
        """
        if timeout != 0:
            self.browser.captureNetworkTraffic('json')
        self.test_app._make_environ(extra_environ)
        if name:
            selector = _eval_xpath('input', locator=self.locator,
                                    name=name, index=index)
            self.browser.click(selector)
        else:
            self.browser.submit(self.locator)
        return self.test_app._get_response(resp=self.resp, timeout=timeout)


###############
# Servers
###############


class WSGIApplication(object):
    """A WSGI middleware to handle special calls used to run a test app"""

    def __init__(self, app, bind):
        self.app = app
        self.serve_forever = True
        self.bind = bind
        self.url = 'http://%s:%s/' % bind
        self.thread = None

    def __call__(self, environ, start_response):
        if '__kill_application__' in environ['PATH_INFO']:
            self.serve_forever = False
            resp = webob.Response()
            return resp(environ, start_response)
        elif '__file__' in environ['PATH_INFO']:
            req = webob.Request(environ)
            resp = webob.Response()
            resp.content_type = 'text/html; charset=UTF-8'
            filename = req.params.get('__file__')
            body = open(filename).read()
            body.replace('http://localhost/',
                         'http://%s/' % req.host)
            if PY3:
                resp.text = body
            else:
                resp.body = body
            return resp(environ, start_response)
        elif '__application__' in environ['PATH_INFO']:
            resp = webob.Response()
            return resp(environ, start_response)
        return self.app(environ, start_response)

    def __repr__(self):
        return '<WSGIApplication %r at %s>' % (self.app, self.url)


class WSGIRequestHandler(simple_server.WSGIRequestHandler):
    """A WSGIRequestHandler who log to a logger"""

    def log_message(self, format, *args):
        log.debug("%s - - [%s] %s" %
                  (self.address_string(),
                  self.log_date_time_string(),
                  format % args))


class WSGIServer(simple_server.WSGIServer):
    """A WSGIServer"""

    def serve_forever(self):
        while self.application.serve_forever:
            self.handle_request()


class FileHandler(SimpleHTTPRequestHandler):
    """Handle a simple file"""

    def translate_path(self, path):
        return self.filename

    def log_message(self, format, *args):
        log.debug("%s - - [%s] %s\n" %
                  (self.address_string(),
                  self.log_date_time_string(),
                  format % args))

###############
# Misc
###############


def _get_value(s):
    if json:
        return json.dumps(s)
    else:
        return repr(str(s))


def _get_command(cmd):
    if '_' in cmd:
        cmd = cmd.split('_')
        cmd = [cmd.pop(0)] + [c.title() for c in cmd]
        cmd = ''.join(cmd)
    return cmd


def _eval_xpath(tag, locator=None, index=None, **kwargs):
    if not locator:
        locator = 'xpath='
    locator += "//%s" % tag
    for k, v in kwargs.items():
        if k in ('for_', 'class_'):
            k = k.strip('_')
        if v:
            if k == 'description':
                locator += '[.="%s"]' % v
            else:
                locator += '[@%s="%s"]' % (k, v)
    if index is not None:
        locator += '[%s]' % (index + 1,)
    return locator


def _free_port():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.bind(('', 0))
    ip, port = s.getsockname()
    s.close()
    ip = os.environ.get('SELENIUM_BIND', '127.0.0.1')
    return ip, port


def is_available():
    """return True if the selenium module is available and a RC server is
    running"""
    if json == False:
        warnings.warn(
            ('selenium is not available because no json module are '
            'available. Consider installing simplejson'),
            SeleniumWarning)
    host = os.environ.get('SELENIUM_HOST', '127.0.0.1')
    port = int(os.environ.get('SELENIUM_PORT', 4444))
    try:
        conn = HTTPConnection(host, port)
        conn.request('GET', '/')
    except socket.error:
        if 'SELENIUM_JAR' not in os.environ:
            return False
        else:
            jar = os.environ['SELENIUM_JAR']
            p = subprocess.Popen(['java', '-jar', jar])
            os.environ['SELENIUM_PID'] = str(p.pid)
            for i in range(30):
                time.sleep(.3)
                try:
                    conn = HTTPConnection(host, port)
                    conn.request('GET', '/')
                except socket.error:
                    pass
                else:
                    return True
            return False
    return True
