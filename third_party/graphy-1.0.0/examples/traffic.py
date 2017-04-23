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

print '<html>'
print '<h2>Oh no!  Traffic is dropping off, something must be wrong!</h2>'
traffic = [578, 579, 580, 550, 545, 552]
chart = google_chart_api.LineChart(traffic)
print chart.display.Img(100, 50)

print """<p>But wait, that was automatically scaled to fill the entire
         vertical range.  We should scale from zero instead:</p>"""

chart.left.min = 0
chart.left.max = 600
print chart.display.Img(100, 50)

print """<p>Also, maybe some labels would help out here:</p>"""
chart.left.labels = range(0, 601, 200)
chart.left.label_positions = chart.left.labels
print chart.display.Img(100, 50)
