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

import math
from graphy.backends import google_chart_api
from graphy import bar_chart

left_channel = []
right_channel = []
for i in xrange(0, 360, 3):
  left_channel.append(100.0 * math.sin(math.radians(i)))
  right_channel.append(100.0 * math.sin(math.radians(i + 30)))

chart = google_chart_api.BarChart()
chart.AddBars(left_channel, color='0000ff')
chart.AddBars(right_channel, color='ff8040')
chart.display.enhanced_encoding = True

print '<html><head><title>Audio Signal</title></head><body>'

print '<h1>Separate</h1>'
chart.stacked = False
chart.style = bar_chart.BarChartStyle(None, 0, 1)
print chart.display.Img(640, 120)

print '<h1>Joined</h1>'
chart.stacked = True
chart.style = bar_chart.BarChartStyle(None, 1)
print chart.display.Img(640, 120)

print '</body></html>'
