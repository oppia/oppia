#!/usr/bin/python2.4
#
# Copyright 2008 Google Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

from graphy.backends import google_chart_api

prices = [78, 102, 175, 181, 160, 195, 138, 158, 179, 183, 222, 211, 215]
url = google_chart_api.Sparkline(prices).display.Url(40, 12)
img = '<img style="display:inline;" src="%s">' % url
print '<html>Stock prices went up %s this quarter.</html>' % img
