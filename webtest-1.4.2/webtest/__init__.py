# (c) 2005 Ian Bicking and contributors; written for Paste
# (http://pythonpaste.org)
# Licensed under the MIT license:
# http://www.opensource.org/licenses/mit-license.php
"""
Routines for testing WSGI applications.

Most interesting is app
"""

from webtest.app import TestApp
from webtest.app import TestRequest
from webtest.app import TestResponse
from webtest.app import Form
from webtest.app import Field
from webtest.app import AppError
from webtest.app import Select
from webtest.app import Radio
from webtest.app import Checkbox
from webtest.app import Text
from webtest.app import Textarea
from webtest.app import Hidden
from webtest.app import Submit
from webtest.app import Upload

from webtest.ext import casperjs

from webtest.sel import SeleniumApp
from webtest.sel import selenium
