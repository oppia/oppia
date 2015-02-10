# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Controller for handling logouts."""

__author__ = 'sbhowmik@google.com (Shantanu Bhowmik)'

import Cookie

import feconf

from google.appengine.api import users
from google.appengine.ext import webapp


class LogoutPage(webapp.RequestHandler):

    ONE_DAY_AGO_IN_SECS = -24 * 60 * 60

    def get(self):
        """Logs the user out and returns them to the current page."""

        # AppEngine sets the ACSID cookie for http:// and the SACSID cookie
        # for https:// . We just unset both below.
        cookie = Cookie.SimpleCookie()
        for cookie_name in ['ACSID', 'SACSID']:
            cookie = Cookie.SimpleCookie()
            cookie[cookie_name] = ''
            cookie[cookie_name]['expires'] = self.ONE_DAY_AGO_IN_SECS
            self.response.headers.add_header(
                *cookie.output().split(': ', 1))

        url_to_redirect_to = self.request.get('url') or '/'
        if feconf.DEV_MODE:
            self.redirect(users.create_logout_url(url_to_redirect_to))
        else:
            self.redirect(url_to_redirect_to)
