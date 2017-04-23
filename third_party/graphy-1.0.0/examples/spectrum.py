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

chart = google_chart_api.PieChart(
    [1, 2, 3, 4, 5, 6, 7],
    ['Red', 'Orange', 'Yellow', 'Green', 'Blue', 'Indigo', 'Violet'],
    ['ff0000', 'ff9933', 'ffff00', '00ff00', '0000ff', '000066', '6600cc'])
img = chart.display.Img(300, 150)
print '<html><body><h1>Colors</h1>%s' % img

chart.display.is3d = True
img = chart.display.Img(300, 100)
print '<h1>3D view</h1>%s</body></html>' % img
