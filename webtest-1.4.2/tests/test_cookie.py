import webtest
from webob import Request
from tests.compat import unittest
from webtest.compat import to_bytes


def cookie_app(environ, start_response):
    req = Request(environ)
    status = "200 OK"
    body = '<html><body><a href="/go/">go</a></body></html>'
    headers = [
        ('Content-Type', 'text/html'),
        ('Content-Length', str(len(body))),
    ]
    if req.path_info != '/go/':
        headers.extend([
            ('Set-Cookie', 'spam=eggs'),
            ('Set-Cookie', 'foo="bar;baz"'),
        ])
    start_response(status, headers)
    return [to_bytes(body)]


def cookie_app2(environ, start_response):
    status = to_bytes("200 OK")
    body = ''
    headers = [
        ('Content-Type', 'text/html'),
        ('Content-Length', str(len(body))),
        ('Set-Cookie', 'spam=eggs'),
        ('Set-Cookie', 'foo="bar;baz"'),
    ]
    start_response(status, headers)
    return [to_bytes(body)]


def cookie_app3(environ, start_response):
    status = to_bytes("200 OK")
    body = 'Cookie: %(HTTP_COOKIE)s' % environ
    headers = [
        ('Content-Type', 'text/html'),
        ('Content-Length', str(len(body))),
    ]
    start_response(status, headers)
    return [to_bytes(body)]


class TestCookies(unittest.TestCase):

    def test_cookies(self):
        app = webtest.TestApp(cookie_app)
        self.assertTrue(not app.cookies,
                        'App should initially contain no cookies')
        app.get('/')
        cookies = app.cookies
        self.assert_(cookies, 'Response should have set cookies')
        self.assertEqual(cookies['spam'], 'eggs')
        self.assertEqual(cookies['foo'], 'bar;baz')

    def test_preserve_cookies(self):
        app = webtest.TestApp(cookie_app)
        res = app.get('/')
        self.assert_(app.cookies)
        res.click('go')
        self.assert_(app.cookies)

    def test_cookies2(self):
        app = webtest.TestApp(cookie_app)
        self.assertTrue(not app.cookies,
                        'App should initially contain no cookies')

        app.get('/')
        self.assert_(app.cookies, 'Response should have set cookies')
        self.assertIn(app.cookies['spam'], 'eggs')
        self.assertIn(app.cookies['foo'], 'bar;baz')

    def test_send_cookies(self):
        app = webtest.TestApp(cookie_app3)
        self.assertTrue(not app.cookies,
                        'App should initially contain no cookies')

        resp = app.get('/', headers=[('Cookie', 'spam=eggs')])
        self.assertFalse(bool(app.cookies),
                     'Response should not have set cookies')
        resp.mustcontain('Cookie: spam=eggs')
