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
from graphy import formatters
from graphy import line_chart

# Average monthly temperature
sunnyvale = [49, 52, 55, 58, 62, 66, 68, 68, 66, 61, 54, 48, 49]
chicago   = [25, 31, 39, 50, 60, 70, 75, 74, 66, 55, 42, 30, 25]

print '<html>'
print '<head><title>Yearly temperature in Chicago and Sunnyvale</title></head>'
print '<body>'
print '<h2>Yearly temperature in Chicago and Sunnyvale</h2>'
chart = google_chart_api.LineChart()
chart.AddLine(sunnyvale)
chart.AddLine(chicago, pattern=line_chart.LineStyle.DASHED)
print chart.display.Img(250, 100)

print "<p>But that's hard to understand.  We need labels:</p>"
chart.bottom.min = 0
chart.bottom.max = 12
chart.bottom.labels = ['Jan', 'Apr', 'Jul', 'Sep', 'Jan']
chart.bottom.label_positions = [0, 3, 6, 9, 12]

chart.left.min = 0
chart.left.max = 80
chart.left.labels = [10, 32, 50, 70]
chart.left.label_positions = [10, 32, 50, 70]
chart.data[0].label = 'Sunnyvale'
chart.data[1].label = 'Chicago'
chart.AddFormatter(formatters.InlineLegend)
print chart.display.Img(250, 100)

print '<p>A grid would be nice, too.</p>'

chart.left.label_gridlines = True
chart.bottom.label_gridlines = True
print chart.display.Img(250, 100)

print '</body>'
print '</html>'
