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

elevation = {'Death Valley':     -210,  # Showing off negative barchart values!
             'Mountain View':      32,
             'Livermore':         400,
             'Riverside':         819,
             'Auburn':           1536,
             'South Lake Tahoe': 6264,
             }
cities     = elevation.keys()
elevations = [elevation[city] for city in cities]

print '<html>'
print '<h1>Elevation</h1>'

chart = google_chart_api.BarChart(elevations)
chart.left.labels = cities
chart.vertical = False
xlabels = range(-1000, 7001, 1000)
chart.bottom.min = min(xlabels)
chart.bottom.max = max(xlabels)
chart.bottom.label_positions = xlabels
chart.bottom.labels = ['%sK' % (x/1000) for x in xlabels]
chart.bottom.grid_spacing = 1000
print chart.display.Img(400, 220)
print '</html>'
