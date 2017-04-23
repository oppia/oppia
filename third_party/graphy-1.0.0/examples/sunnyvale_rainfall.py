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

monthly_rainfall = [3.2, 3.2, 2.7, 0.9, 0.4, 0.1, 0.0, 0.0, 0.2, 0.9, 1.8, 2.3]
months = 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split()

chart = google_chart_api.LineChart(monthly_rainfall)
chart.bottom.labels = months
img = chart.display.Img(400, 100)
print '<html><h1>Monthly Rainfall for Sunnyvale, CA</h1>%s</html>' % img
