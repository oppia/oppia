# coding: utf-8
#
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


__author__ = 'Frederik Creemers'

import datetime
import re
import yaml

def get_cron_job_frequency(url):

    content = yaml.load(open('cron.yaml'))
    tasks = content['cron']
    for task in tasks:
        if task.get('url') == url:
            schedule = task.get('schedule')
            match = re.match(r'every (\d+) (hours|mins|minutes)', schedule)
            if not match:
                raise ValueError('currently, only schedules of the form'
                                 '"every \d+ (hous|mins|minutes)" are supported.')

            quantity = int(match.group(1))
            unit = match.group(2)

            seconds_multipliers = {
                'mins': 60,
                'minutes': 60,
                'hours': 3600
            }

            seconds = quantity * seconds_multipliers[unit]
            return datetime.timedelta(seconds=seconds)