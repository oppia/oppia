import webtest
from webtest.debugapp import debug_app
from tests.compat import unittest

class TestEnviron(unittest.TestCase):

    def test_get_extra_environ(self):
        app = webtest.TestApp(debug_app,
                              extra_environ={'HTTP_ACCEPT_LANGUAGE': 'ru',
                                             'foo': 'bar'})
        res = app.get('http://localhost/')
        self.assertIn('HTTP_ACCEPT_LANGUAGE: ru', res, res)
        self.assertIn("foo: 'bar'", res, res)

        res = app.get('http://localhost/', extra_environ={'foo': 'baz'})
        self.assertIn('HTTP_ACCEPT_LANGUAGE: ru', res, res)
        self.assertIn("foo: 'baz'", res, res)


    def test_post_extra_environ(self):
        app = webtest.TestApp(debug_app,
                              extra_environ={'HTTP_ACCEPT_LANGUAGE': 'ru',
                                             'foo': 'bar'})
        res = app.post('http://localhost/')
        self.assertIn('HTTP_ACCEPT_LANGUAGE: ru', res, res)
        self.assertIn("foo: 'bar'", res, res)

        res = app.post('http://localhost/', extra_environ={'foo': 'baz'})
        self.assertIn('HTTP_ACCEPT_LANGUAGE: ru', res, res)
        self.assertIn("foo: 'baz'", res, res)


    def test_request_extra_environ(self):
        app = webtest.TestApp(debug_app,
                              extra_environ={'HTTP_ACCEPT_LANGUAGE': 'ru',
                                             'foo': 'bar'})
        res = app.request('http://localhost/', method='GET')
        self.assertIn('HTTP_ACCEPT_LANGUAGE: ru', res, res)
        self.assertIn("foo: 'bar'", res, res)

        res = app.request('http://localhost/', method='GET',
                                               environ={'foo': 'baz'})
        self.assertIn('HTTP_ACCEPT_LANGUAGE: ru', res, res)
        self.assertIn("foo: 'baz'", res, res)
