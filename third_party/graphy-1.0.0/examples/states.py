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
from graphy import common

# Area of some states, in square miles
# Data from http://www.enchantedlearning.com/usa/states/area.shtml
area = {'WA': 71303,
        'OR': 98386,
        'ID': 83574,
        'MT': 147046,
        'WY': 97818,
        'ME': 35387,
        'VT': 9615,
        'NH': 9351,
        'MA': 10555,
        'NY': 54475,
        'CT': 5544,
        'RI': 1545,
        'NJ': 8722,
        'PA': 46058}
northwest = ('WA', 'OR', 'ID', 'MT', 'WY')
northeast = ('ME', 'VT', 'NH', 'MA', 'NY', 'CT', 'RI', 'NJ', 'PA')
states = northwest + northeast
areas = [area[s] for s in states]

print '<html><body>'
print '<h1>Areas of States in the Northwest and Northeast US</h1>'
print '<h3>(in square miles)</h3>'

chart = google_chart_api.BarChart(areas)
chart.bottom.labels = states
region_axis = common.Axis()
region_axis.min = 0
region_axis.max = 100
region_axis.labels = ['Northwest', 'Northeast']
region_axis.label_positions = [20, 60]
chart.AddAxis(common.AxisPosition.BOTTOM, region_axis)
ylabels = range(0, 150001, 50000)
chart.left.min = min(ylabels)
chart.left.max = max(ylabels)
chart.left.labels = ['%sK' % (x / 1000) for x in ylabels]
chart.left.label_positions = ylabels
print chart.display.Img(500, 220)
print '</body></html>'
