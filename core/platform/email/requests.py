# coding: utf-8
#
# Copyright 2016 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
""" Provide methods to send HTTP requests (Only POST for now). """


import base64
import urllib2


def _auth_str(username, password):
    """Generate authentication string."""
    if isinstance(username, unicode):
        username = username.encode('latin1')
    if isinstance(password, unicode):
        password = password.encode('latin1')

    return 'Basic ' + base64.b64encode(b':'.join((username, password))).strip()


def _auth_header(username, password):
    """Generate authentication header, as a dictionary."""
    assert isinstance(username, basestring)
    assert isinstance(password, basestring)

    auth_str = _auth_str(username, password)
    return {'Authorization': auth_str}


def post(server, auth, data):
    """Send post http request."""
    headers = _auth_header(*auth)
    req = urllib2.Request(server, data, headers)
    urllib2.urlopen(req)
