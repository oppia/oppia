import webob

import webtest
from webtest.debugapp import debug_app
from tests.compat import unittest

class TestFragemts(unittest.TestCase):

    def test_url_without_fragments(self):
        app = webtest.TestApp(debug_app)
        res = app.get('http://localhost/')
        self.assertEqual(res.status_int, 200)

    def test_url_with_fragments(self):
        app = webtest.TestApp(debug_app)
        res = app.get('http://localhost/#ananchor')
        self.assertEqual(res.status_int, 200)
