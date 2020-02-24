# -*- coding: utf-8 -*-
from webob import Request
import webtest
from webtest.compat import binary_type
from webtest.compat import to_bytes
from tests.compat import unittest
from tests.compat import u

def select_app(environ, start_response):
    req = Request(environ)
    status = "200 OK"
    if req.method == "GET":
        body = to_bytes(
"""
<html>
    <head><title>form page</title></head>
    <body>
        <form method="POST" id="single_select_form">
            <select id="single" name="single">
                <option value="4">Four</option>
                <option value="5" selected="selected">Five</option>
                <option value="6">Six</option>
                <option value="7">Seven</option>
            </select>
            <input name="button" type="submit" value="single">
        </form>
        <form method="POST" id="multiple_select_form">
            <select id="multiple" name="multiple" multiple="multiple">
                <option value="8" selected="selected">Eight</option>
                <option value="9">Nine</option>
                <option value="10">Ten</option>
                <option value="11" selected="selected">Eleven</option>
            </select>
            <input name="button" type="submit" value="multiple">
        </form>
    </body>
</html>
""")
    else:
        select_type = req.POST.get("button")
        if select_type == "single":
            selection = req.POST.get("single")
        elif select_type == "multiple":
            selection = ", ".join(req.POST.getall("multiple"))
        body = to_bytes(
"""
<html>
    <head><title>display page</title></head>
    <body>
        <p>You submitted the %(select_type)s </p>
        <p>You selected %(selection)s</p>
    </body>
</html>
""" % locals())

    headers = [
        ('Content-Type', 'text/html; charset=utf-8'),
        ('Content-Length', str(len(body)))]
    start_response(status, headers)
    return [body]

def select_app_without_default(environ, start_response):
    req = Request(environ)
    status = "200 OK"
    if req.method == "GET":
        body = to_bytes(
"""
<html>
    <head><title>form page</title></head>
    <body>
        <form method="POST" id="single_select_form">
            <select id="single" name="single">
                <option value="4">Four</option>
                <option value="5">Five</option>
                <option value="6">Six</option>
                <option value="7">Seven</option>
            </select>
            <input name="button" type="submit" value="single">
        </form>
        <form method="POST" id="multiple_select_form">
            <select id="multiple" name="multiple" multiple="multiple">
                <option value="8">Eight</option>
                <option value="9">Nine</option>
                <option value="10">Ten</option>
                <option value="11">Eleven</option>
            </select>
            <input name="button" type="submit" value="multiple">
        </form>
    </body>
</html>
""")
    else:
        select_type = req.POST.get("button")
        if select_type == "single":
            selection = req.POST.get("single")
        elif select_type == "multiple":
            selection = ", ".join(req.POST.getall("multiple"))
        body = to_bytes(
"""
<html>
    <head><title>display page</title></head>
    <body>
        <p>You submitted the %(select_type)s </p>
        <p>You selected %(selection)s</p>
    </body>
</html>
""" % locals())

    headers = [
        ('Content-Type', 'text/html; charset=utf-8'),
        ('Content-Length', str(len(body)))]
    start_response(status, headers)
    return [body]


def select_app_unicode(environ, start_response):
    req = Request(environ)
    status = "200 OK"
    if req.method == "GET":
        body =\
u("""
<html>
    <head><title>form page</title></head>
    <body>
        <form method="POST" id="single_select_form">
            <select id="single" name="single">
                <option value="ЕКБ">Екатеринбург</option>
                <option value="МСК" selected="selected">Москва</option>
                <option value="СПБ">Санкт-Петербург</option>
                <option value="САМ">Самара</option>
            </select>
            <input name="button" type="submit" value="single">
        </form>
        <form method="POST" id="multiple_select_form">
            <select id="multiple" name="multiple" multiple="multiple">
                <option value="8" selected="selected">Лондон</option>
                <option value="9">Париж</option>
                <option value="10">Пекин</option>
                <option value="11" selected="selected">Бристоль</option>
            </select>
            <input name="button" type="submit" value="multiple">
        </form>
    </body>
</html>
""").encode('utf8')
    else:
        select_type = req.POST.get("button")
        if select_type == "single":
            selection = req.POST.get("single")
        elif select_type == "multiple":
            selection = ", ".join(req.POST.getall("multiple"))
        body = (
u("""
<html>
    <head><title>display page</title></head>
    <body>
        <p>You submitted the %(select_type)s </p>
        <p>You selected %(selection)s</p>
    </body>
</html>
""") % locals()).encode('utf8')
    headers = [
        ('Content-Type', 'text/html; charset=utf-8'),
        ('Content-Length', str(len(body)))]
    start_response(status, headers)
    if not isinstance(body, binary_type):
        raise AssertionError('Body is not %s' % binary_type)
    return [body]

class TestSelect(unittest.TestCase):

    def test_unicode_select(self):
        app = webtest.TestApp(select_app_unicode)
        res = app.get('/')
        single_form = res.forms["single_select_form"]
        self.assertEqual(single_form["single"].value, u("МСК"))

        display = single_form.submit("button")
        self.assertIn(u("<p>You selected МСК</p>"), display, display)

        res = app.get('/')
        single_form = res.forms["single_select_form"]
        self.assertEqual(single_form["single"].value, u("МСК"))
        single_form.set("single", u("СПБ"))
        self.assertEqual(single_form["single"].value, u("СПБ"))
        display = single_form.submit("button")
        self.assertIn(u("<p>You selected СПБ</p>"), display, display)



    def test_single_select(self):
        app = webtest.TestApp(select_app)
        res = app.get('/')
        self.assertEqual(res.status_int, 200)
        self.assertEqual(res.headers['content-type'], 'text/html; charset=utf-8')
        self.assertEqual(res.content_type, 'text/html')

        single_form = res.forms["single_select_form"]
        self.assertEqual(single_form["single"].value, "5")
        display = single_form.submit("button")
        self.assertIn("<p>You selected 5</p>", display, display)

        res = app.get('/')
        self.assertEqual(res.status_int, 200)
        self.assertEqual(res.headers['content-type'], 'text/html; charset=utf-8')
        self.assertEqual(res.content_type, 'text/html')

        single_form = res.forms["single_select_form"]
        self.assertEqual(single_form["single"].value, "5")
        single_form.set("single", "6")
        self.assertEqual(single_form["single"].value, "6")
        display = single_form.submit("button")
        self.assertIn("<p>You selected 6</p>", display, display)

    def test_single_select_forced_value(self):
        app = webtest.TestApp(select_app)
        res = app.get('/')
        self.assertEqual(res.status_int, 200)
        self.assertEqual(res.headers['content-type'], 'text/html; charset=utf-8')
        self.assertEqual(res.content_type, 'text/html')

        single_form = res.forms["single_select_form"]
        self.assertEqual(single_form["single"].value, "5")
        try:
            single_form.set("single", "984")
            self.assertTrue(False, "not-an-option value error should have been raised")
        except ValueError:
            pass
        single_form["single"].force_value("984")
        self.assertEqual(single_form["single"].value, "984")
        display = single_form.submit("button")
        self.assertIn("<p>You selected 984</p>", display, display)

    def test_single_select_no_default(self):
        app = webtest.TestApp(select_app_without_default)
        res = app.get('/')
        self.assertEqual(res.status_int, 200)
        self.assertEqual(res.headers['content-type'], 'text/html; charset=utf-8')
        self.assertEqual(res.content_type, 'text/html')

        single_form = res.forms["single_select_form"]
        self.assertEqual(single_form["single"].value, "4")
        display = single_form.submit("button")
        self.assertIn("<p>You selected 4</p>", display, display)

        res = app.get('/')
        self.assertEqual(res.status_int, 200)
        self.assertEqual(res.headers['content-type'], 'text/html; charset=utf-8')
        self.assertEqual(res.content_type, 'text/html')

        single_form = res.forms["single_select_form"]
        self.assertEqual(single_form["single"].value, "4")
        single_form.set("single", 6)
        self.assertEqual(single_form["single"].value, "6")
        display = single_form.submit("button")
        self.assertIn("<p>You selected 6</p>", display, display)

    def test_multiple_select(self):
        app = webtest.TestApp(select_app)
        res = app.get('/')
        self.assertEqual(res.status_int, 200)
        self.assertEqual(res.headers['content-type'], 'text/html; charset=utf-8')
        self.assertEqual(res.content_type, 'text/html')

        multiple_form = res.forms["multiple_select_form"]
        self.assertEqual(multiple_form["multiple"].value, ['8', '11'],\
            multiple_form["multiple"].value)
        display = multiple_form.submit("button")
        self.assertIn("<p>You selected 8, 11</p>", display, display)

        res = app.get('/')
        self.assertEqual(res.status_int, 200)
        self.assertEqual(res.headers['content-type'], 'text/html; charset=utf-8')
        self.assertEqual(res.content_type, 'text/html')

        multiple_form = res.forms["multiple_select_form"]
        self.assertEqual(multiple_form["multiple"].value, ["8", "11"],\
            multiple_form["multiple"].value)
        multiple_form.set("multiple", ["9"])
        self.assertEqual(multiple_form["multiple"].value, ["9"],\
            multiple_form["multiple"].value)
        display = multiple_form.submit("button")
        self.assertIn("<p>You selected 9</p>", display, display)

    def test_multiple_select_forced_values(self):
        app = webtest.TestApp(select_app)
        res = app.get('/')
        self.assertEqual(res.status_int, 200)
        self.assertEqual(res.headers['content-type'], 'text/html; charset=utf-8')
        self.assertEqual(res.content_type, 'text/html')

        multiple_form = res.forms["multiple_select_form"]
        self.assertEqual(multiple_form["multiple"].value, ["8", "11"],\
            multiple_form["multiple"].value)
        try:
            multiple_form.set("multiple", ["24", "88"])
            self.assertTrue(False, "not-an-option value error should have been raised")
        except ValueError:
            pass
        multiple_form["multiple"].force_value(["24", "88"])
        self.assertEqual(multiple_form["multiple"].value, ["24", "88"],\
            multiple_form["multiple"].value)
        display = multiple_form.submit("button")
        self.assertIn("<p>You selected 24, 88</p>", display, display)

    def test_multiple_select_no_default(self):
        app = webtest.TestApp(select_app_without_default)
        res = app.get('/')
        self.assertEqual(res.status_int, 200)
        self.assertEqual(res.headers['content-type'], 'text/html; charset=utf-8')
        self.assertEqual(res.content_type, 'text/html')

        multiple_form = res.forms["multiple_select_form"]
        self.assertTrue(multiple_form["multiple"].value is None,\
            repr(multiple_form["multiple"].value))
        display = multiple_form.submit("button")
        self.assertIn("<p>You selected </p>", display, display)

        res = app.get('/')
        self.assertEqual(res.status_int, 200)
        self.assertEqual(res.headers['content-type'], 'text/html; charset=utf-8')
        self.assertEqual(res.content_type, 'text/html')

        multiple_form = res.forms["multiple_select_form"]
        self.assertTrue(multiple_form["multiple"].value is None,\
            multiple_form["multiple"].value)
        multiple_form.set("multiple", ["9"])
        self.assertEqual(multiple_form["multiple"].value, ["9"],\
            multiple_form["multiple"].value)
        display = multiple_form.submit("button")
        self.assertIn("<p>You selected 9</p>", display, display)
