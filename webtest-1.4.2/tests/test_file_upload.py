import os.path
import struct
from tests.compat import unittest
from webtest.compat import to_bytes
from webtest.compat import to_string
from webtest.compat import join_bytes
from webtest.compat import binary_type
from webtest.compat import PY3
from webob import Request
import webtest

def single_upload_file_app(environ, start_response):
    req = Request(environ)
    status = "200 OK"
    if req.method == "GET":
        body = to_bytes(
"""
<html>
    <head><title>form page</title></head>
    <body>
        <form method="POST" id="file_upload_form"
              enctype="multipart/form-data">
            <input name="file-field" type="file" />
            <input name="button" type="submit" value="single">
        </form>
    </body>
</html>
""")
    else:
        uploaded_files = req.POST.getall("file-field")
        body_head = to_bytes(
"""
<html>
    <head><title>display page</title></head>
    <body>
""")

        file_parts = []
        for uploaded_file in uploaded_files:
            file_parts.append(\
"""        <p>You selected '%(filename)s'</p>
        <p>with contents: '%(value)s'</p>
""" % dict(filename=to_string(uploaded_file.filename),
           value=to_string(uploaded_file.value)))

        body_foot = to_bytes(
"""    </body>
</html>
""")
        body = body_head + join_bytes("", file_parts) + body_foot
    headers = [
        ('Content-Type', 'text/html; charset=utf-8'),
        ('Content-Length', str(len(body)))]
    start_response(status, headers)
    assert(isinstance(body, binary_type))
    return [body]


def upload_binary_app(environ, start_response):
    req = Request(environ)
    status = "200 OK"
    if req.method == "GET":
        body = to_bytes("""
<html>
    <head><title>form page</title></head>
    <body>
        <form method="POST" id="binary_upload_form"
              enctype="multipart/form-data">
            <input name="binary-file-field" type="file" />
            <input name="button" type="submit" value="binary" />
        </form>
    </body>
</html>
""")
    else:
        uploaded_files = req.POST.getall("binary-file-field")
        data = [str(n) for n in struct.unpack('255h', uploaded_files[0].value)]
        body = to_bytes("""
<html>
    <head><title>display page</title></head>
    <body>
        %s
    </body>
</html>
""" % join_bytes(',', data))
    headers = [
        ('Content-Type', 'text/html; charset=utf-8'),
        ('Content-Length', str(len(body)))]
    start_response(status, headers)
    return [body]


def multiple_upload_file_app(environ, start_response):
    req = Request(environ)
    status = "200 OK"
    if req.method == "GET":
        body = to_bytes(
"""
<html>
    <head><title>form page</title></head>
    <body>
        <form method="POST" id="file_upload_form"
              enctype="multipart/form-data">
            <input name="file-field-1" type="file" />
            <input name="file-field-2" type="file" />
            <input name="button" type="submit" value="single">
        </form>
    </body>
</html>
""")
    else:
        uploaded_file_1 = req.POST.get("file-field-1")
        uploaded_file_2 = req.POST.get("file-field-2")
        uploaded_files = [uploaded_file_1, uploaded_file_2]

        body_head = to_bytes(
"""
<html>
    <head><title>display page</title></head>
    <body>
""")

        file_parts = []
        for uploaded_file in uploaded_files:
            print (to_bytes(uploaded_file.filename), type(uploaded_file.value))
            file_parts.append(
"""
        <p>You selected '%(filename)s'</p>
        <p>with contents: '%(value)s'</p>
""" % dict(filename=to_string(uploaded_file.filename),
           value=to_string(uploaded_file.value)))

        body_foot = to_bytes(
"""    </body>
</html>
""")
        body = body_head + join_bytes("", file_parts) + body_foot
    headers = [
        ('Content-Type', 'text/html; charset=utf-8'),
        ('Content-Length', str(len(body)))]
    start_response(status, headers)
    return [body]

class TestFileUpload(unittest.TestCase):

    def test_no_uploads_error(self):
        app = webtest.TestApp(single_upload_file_app)
        uploads = app.get('/').forms["file_upload_form"].upload_fields()


    def test_upload_without_file(self):
        app = webtest.TestApp(single_upload_file_app)
        upload_form = app.get('/').forms["file_upload_form"]
        upload_form.submit()


    def test_file_upload_with_filename_only(self):
        uploaded_file_name = \
            os.path.join(os.path.dirname(__file__), "__init__.py")
        uploaded_file_contents = open(uploaded_file_name).read()
        if PY3:
            uploaded_file_contents = to_bytes(uploaded_file_contents)

        app = webtest.TestApp(single_upload_file_app)
        res = app.get('/')
        self.assertEqual(res.status_int, 200)
        self.assertEqual(res.headers['content-type'], 'text/html; charset=utf-8')
        self.assertEqual(res.content_type, 'text/html')
        self.assertEqual(res.charset, 'utf-8')

        single_form = res.forms["file_upload_form"]
        single_form.set("file-field", (uploaded_file_name,))
        display = single_form.submit("button")
        self.assertIn("<p>You selected '%s'</p>" % uploaded_file_name, display, display)
        self.assertIn("<p>with contents: '%s'</p>" % to_string(uploaded_file_contents), display, \
            display)


    def test_file_upload_with_filename_and_contents(self):
        uploaded_file_name = \
            os.path.join(os.path.dirname(__file__), "__init__.py")
        uploaded_file_contents = open(uploaded_file_name).read()
        if PY3:
            uploaded_file_contents = to_bytes(uploaded_file_contents)

        app = webtest.TestApp(single_upload_file_app)
        res = app.get('/')
        self.assertEqual(res.status_int, 200)
        self.assertEqual(res.headers['content-type'], 'text/html; charset=utf-8')
        self.assertEqual(res.content_type, 'text/html')

        single_form = res.forms["file_upload_form"]
        single_form.set("file-field",
                        (uploaded_file_name, uploaded_file_contents))
        display = single_form.submit("button")
        self.assertIn("<p>You selected '%s'</p>" % uploaded_file_name, display, display)
        self.assertIn("<p>with contents: '%s'</p>" % to_string(uploaded_file_contents), display, \
            display)


    def test_file_upload_binary(self):
        binary_data = struct.pack('255h', *range(0,255))
        app = webtest.TestApp(upload_binary_app)
        res = app.get('/')
        single_form = res.forms["binary_upload_form"]
        single_form.set("binary-file-field", ('my_file.dat', binary_data))
        display = single_form.submit("button")
        self.assertIn(','.join([str(n) for n in range(0,255)]), display)


    def test_multiple_file_uploads_with_filename_and_contents(self):
        uploaded_file1_name = \
            os.path.join(os.path.dirname(__file__), "__init__.py")
        uploaded_file1_contents = open(uploaded_file1_name).read()
        if PY3:
            uploaded_file1_contents = to_bytes(uploaded_file1_contents)
        uploaded_file2_name = __file__
        uploaded_file2_contents = open(uploaded_file2_name).read()
        if PY3:
            uploaded_file2_contents = to_bytes(uploaded_file2_contents)

        app = webtest.TestApp(multiple_upload_file_app)
        res = app.get('/')
        self.assertEqual(res.status_int, 200)
        self.assertEqual(res.headers['content-type'], 'text/html; charset=utf-8')
        self.assertEqual(res.content_type, 'text/html')

        single_form = res.forms["file_upload_form"]
        single_form.set("file-field-1", (uploaded_file1_name, uploaded_file1_contents))
        single_form.set("file-field-2", (uploaded_file2_name, uploaded_file2_contents))
        display = single_form.submit("button")
        self.assertIn("<p>You selected '%s'</p>" % uploaded_file1_name, display, display)
        self.assertIn("<p>with contents: '%s'</p>" % to_string(uploaded_file1_contents), display, \
            display)
        self.assertIn("<p>You selected '%s'</p>" % uploaded_file2_name, display, display)
        self.assertIn("<p>with contents: '%s'</p>" % to_string(uploaded_file2_contents), display, \
            display)
