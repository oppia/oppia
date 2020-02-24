import collections
from tests.compat import unittest
from webtest.compat import to_bytes
from webtest.compat import to_string
from webtest.compat import join_bytes
from webtest.compat import binary_type
from webtest.compat import PY3
from webob import Request
import webtest
import sys


deform_upload_fields_text = \
"""
      <input type="hidden" name="_charset_" />
      <input type="hidden" name="__formid__" value="deform"/>
      <input type="text" name="title" value="" id="deformField1"/>
      <input type="hidden" name="__start__" value="fileupload:mapping"/>
        <input type="file" name="fileupload" id="deformField2"/>
      <input type="hidden" name="__end__" value="fileupload:mapping"/>
      <textarea id="deformField3" name="description" rows="10" cols="60"></textarea>
      <button
          id="deformSubmit"
          name="Submit"
          type="submit"
          value="Submit">
          Submit
      </button>
"""


def get_submit_app(form_id, form_fields_text):
    def submit_app(environ, start_response):
        req = Request(environ)
        status = "200 OK"
        if req.method == "GET":
            body = to_bytes("""
<html>
  <head><title>form page</title></head>
  <body>
    <form
        id="%s"
        action=""
        method="POST"
        enctype="multipart/form-data"
        accept-charset="utf-8">

      %s
    </form>
  </body>
</html>
""" % (form_id, form_fields_text))
        else:
            body_head = to_bytes(
"""
<html>
    <head><title>display page</title></head>
    <body>
""")

            body_parts = []
            for (name, value) in req.POST.items():
                if hasattr(value, 'filename'):
                    body_parts.append("%s:%s:%s\n" % (
                        to_string(name),
                        to_string(value.filename),
                        to_string(value.value)))
                else:
                    body_parts.append("%s:%s\n" % (
                        to_string(name), to_string(value)))

            body_foot = to_bytes(
    """    </body>
    </html>
    """)
            body = body_head + join_bytes("", body_parts) + body_foot
        headers = [
            ('Content-Type', 'text/html; charset=utf-8'),
            ('Content-Length', str(len(body)))]
        start_response(status, headers)
        assert(isinstance(body, binary_type))
        return [body]
    return submit_app


@unittest.skipIf(sys.version_info[:2] < (2, 7), 'Only work with 2.7+')
class TestFieldOrder(unittest.TestCase):

    def test_submit_with_file_upload(self):
        uploaded_file_name = 'test.txt'
        uploaded_file_contents = 'test content file upload'
        if PY3:
            uploaded_file_contents = to_bytes(uploaded_file_contents)

        deform_upload_file_app = get_submit_app('deform',
            deform_upload_fields_text)
        app = webtest.TestApp(deform_upload_file_app)
        res = app.get('/')
        self.assertEqual(res.status_int, 200)
        self.assertEqual(
            res.headers['content-type'], 'text/html; charset=utf-8')
        self.assertEqual(res.content_type, 'text/html')
        self.assertEqual(res.charset, 'utf-8')

        single_form = res.forms["deform"]
        single_form.set("title", "testtitle")
        single_form.set("fileupload",
            (uploaded_file_name, uploaded_file_contents))
        single_form.set("description", "testdescription")
        display = single_form.submit("Submit")
        self.assertTrue(
"""_charset_:
__formid__:deform
title:testtitle
__start__:fileupload:mapping
fileupload:test.txt:test content file upload
__end__:fileupload:mapping
description:testdescription
Submit:Submit
""" in display)

    def test_post_with_file_upload(self):
        uploaded_file_name = 'test.txt'
        uploaded_file_contents = 'test content file upload'
        if PY3:
            uploaded_file_contents = to_bytes(uploaded_file_contents)

        deform_upload_file_app = get_submit_app('deform',
            deform_upload_fields_text)
        app = webtest.TestApp(deform_upload_file_app)
        display = app.post("/", collections.OrderedDict([
            ('_charset_', ''),
            ('__formid__', 'deform'),
            ('title', 'testtitle'),
            ('__start__', 'fileupload:mapping'),
              ('fileupload', webtest.Upload(uploaded_file_name, uploaded_file_contents)),
            ('__end__', 'fileupload:mapping'),
            ('description', 'testdescription'),
            ('Submit', 'Submit')]))

        self.assertTrue(
"""_charset_:
__formid__:deform
title:testtitle
__start__:fileupload:mapping
fileupload:test.txt:test content file upload
__end__:fileupload:mapping
description:testdescription
Submit:Submit""" in display)

    def test_field_order_is_across_all_fields(self):
        fields = """
<input type="text" name="letter" value="a">
<input type="text" name="letter" value="b">
<input type="text" name="number" value="1">
<input type="text" name="letter" value="c">
<input type="text" name="number" value="2">
<input type="submit" name="save" value="Save 1">
<input type="text" name="letter" value="d">
<input type="submit" name="save" value="Save 2">
<input type="text" name="letter" value="e">
"""
        submit_app = get_submit_app('test', fields)
        app = webtest.TestApp(submit_app)
        get_res = app.get("/")
        # Submit the form with the second submit button.
        display = get_res.forms[0].submit('save', 1)
        self.assertTrue(
"""letter:a
letter:b
number:1
letter:c
number:2
letter:d
save:Save 2
letter:e""" in display)
