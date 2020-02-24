# -*- coding: utf-8 -*-
__doc__ = '''Allow to run an external process to test your application'''
from webtest import app as testapp
from webtest.sel import _free_port
from webtest.sel import WSGIApplication
from webtest.sel import WSGIServer
from webtest.sel import WSGIRequestHandler
from webtest.compat import HTTPConnection
from webtest.compat import CannotSendRequest
from webtest.compat import to_bytes
from webtest.compat import to_string
from contextlib import contextmanager
from wsgiref import simple_server
import subprocess
import threading
import socket
import time
import sys
import os


class TestApp(testapp.TestApp):
    """Run the test application in a separate thread to allow to access it via
    http"""

    def __init__(self, app=None, url=None, timeout=30000,
                 extra_environ=None, relative_to=None, **kwargs):
        if app:
            super(TestApp, self).__init__(app, relative_to=relative_to)
            self._run_server(self.app)
            self.application_url = self.app.url
            os.environ['APPLICATION_URL'] = self.application_url
        self.extra_environ = extra_environ or {}
        self.timeout = timeout
        self.test_app = self

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

    def get_binary(self, name):
        if os.path.isfile(name):
            return name
        for path in (os.getcwd(), '/usr/local', '/usr', '/opt'):
            filename = os.path.join(path, 'bin', name)
            if os.path.isfile(filename):
                return filename
        return None

    def close(self):
        """Close WSGI server if needed"""
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


@contextmanager
def casperjs(test_app):
    """A context manager to run a test with a :class:`webtest.ext.TestApp`"""
    app = TestApp(test_app.app)
    binary = app.get_binary('casperjs')

    def run(script, *args):
        dirname = os.path.dirname(sys._getframe(1).f_code.co_filename)
        script = os.path.join(dirname, script)
        if binary:
            cmd = [binary, 'test'] + list(args) + [script]
            p = subprocess.Popen(cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE)
            p.wait()
            output = p.stdout.read()
            if to_bytes('FAIL') in output:
                print(to_string(output))

                raise AssertionError(
                        'Failure while running %s' % ' '.join(cmd))

    try:
        yield run
    finally:
        app.close()
