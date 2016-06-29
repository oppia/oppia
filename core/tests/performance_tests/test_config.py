# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

"""Config file for threshold metrics of Performance Tests.

This file contains, for every Oppia page, corresponding thresholds for
different performance metrics.

Each page entry includes:
    url: relative path to the page.
    size_limits_mb: threshold for the total data transferred to load the page,
                    which includes size of all resources requested to display
                    the page for:
        uncached: a new session i.e, a first time user.
        cached: a cached session i.e, a return user.
    load_time_limits_secs: threshold for the total time to load the page,
                            which includes time taken to load all the resources
                            required by the page.
        uncached: see above.
        cached: see above.
"""

SPLASH_PAGE_KEY = 'splash'

TEST_DATA = {
    SPLASH_PAGE_KEY: {
        'url': '/splash',
        'size_limits_mb': {
            'uncached': 10.0,
            'cached': 1.0,
        },
        'load_time_limits_secs': {
            'uncached': 10.0,
            'cached': 3.0,
        },
    }
}
