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

# Population data from http://www.abag.ca.gov
#                      Population
#   Name              2000    1960
cities = [
  ('San Jose',        894943, 204196),
  ('San Francisco',   776733, 740316),
  ('Oakland',         399484, 367548),
  ('Fremont',         203413,  43790),
  ('Sunnyvale',       131760,  59898),
  ('Palo Alto',        58598,  52287),
]
names, pop2000, pop1960 = zip(*cities)

print '<html><head><title>Population Bar Chart</title></head><body>'
print '<h1>Population of Select Bay Area Cities</h1>'

chart = google_chart_api.BarChart()
chart.left.labels = names
chart.AddBars(pop2000, label='2000', color='0000aa')
chart.AddBars(pop1960, label='1960', color='ddddff')

chart.vertical = False
xlabels = range(0, 1000001, 200000)
chart.bottom.grid_spacing = 200000
chart.bottom.min = min(xlabels)
chart.bottom.max = max(xlabels)
chart.bottom.label_positions = xlabels
chart.bottom.labels = ['%sK' % (x/1000) for x in xlabels]
print chart.display.Img(400, 400)




print '<h1>You could also do this as 2 charts</h1>'
chart = google_chart_api.BarChart(pop2000)
chart.left.labels = names
chart.vertical = False
xlabels = range(0, 1000001, 200000)
chart.bottom.grid_spacing = 200000
chart.bottom.min = min(xlabels)
chart.bottom.max = max(xlabels)
chart.bottom.label_positions = xlabels
chart.bottom.labels = ['%sK' % (x/1000) for x in xlabels]
print '<h3>2000</h3>'
print chart.display.Img(400, 220)
chart.data[0].data = pop1960  # Swap in older data
print '<h3>1960</h3>'
print chart.display.Img(400, 220)
print '</body></html>'
