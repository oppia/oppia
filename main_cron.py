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

"""Main package for URL routing and the index page."""

__author__ = 'Sean Lip'

import feconf

from core.controllers import cron
from core.platform import models
transaction_services = models.Registry.import_transaction_services()

import webapp2
from webapp2_extras.routes import RedirectRoute


def get_redirect_route(regex_route, handler, name, defaults=None):
    """Returns a route that redirects /foo/ to /foo.

    Warning: this method strips off parameters after the trailing slash. URLs
    with parameters should be formulated without the trailing slash.
    """
    if defaults is None:
        defaults = {}
    return RedirectRoute(
        regex_route, handler, name, strict_slash=True, defaults=defaults)


# Register the URL with the responsible classes
urls = [
    get_redirect_route(r'/cron/statistics', cron.StatisticsHandler, 'statistics_handler'),
]


app = transaction_services.toplevel_wrapper(
    webapp2.WSGIApplication(urls, debug=feconf.DEBUG))
