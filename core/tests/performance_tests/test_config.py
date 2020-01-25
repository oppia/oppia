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

from __future__ import unicode_literals  # pylint: disable=import-only-modules

PAGE_KEY_SPLASH = 'splash'
PAGE_KEY_LIBRARY = 'library'
PAGE_KEY_CREATOR_DASHBOARD = 'dashboard'
PAGE_KEY_EXPLORATION_PLAYER = 'explore'
PAGE_KEY_EXPLORATION_EDITOR = 'editor'
PAGE_KEY_COLLECTION_PLAYER = 'collection'
PAGE_KEY_PROFILE = 'profile'

# Default port for GAE server that is used for performance tests.
PERFORMANCE_TESTS_SERVER_PORT = 9501

# Possible preload options. Exactly one of these can be used.
PRELOAD_NONE = 'NONE'
PRELOAD_DO_LOGIN = 'DO_LOGIN'
PRELOAD_CREATE_EXP = 'CREATE_EXPLORATION'
PRELOAD_LOAD_DEMO_COLLECTIONS = 'LOAD_DEMO_COLLECTIONS'
PRELOAD_RELOAD_DEMO_EXPS = 'RELOAD_DEMO_EXPLORATIONS'
PRELOAD_RELOAD_FIRST_EXP = 'RELOAD_FIRST_EXPLORATION'

TEST_DATA = {
    PAGE_KEY_SPLASH: {
        'url': '/splash',
        'size_limits_mb': {
            'uncached': 6.5,
            'cached': 1.0,
        },
        'load_time_limits_secs': {
            'uncached': 10.0,
            'cached': 3.0,
        },
        'preload_options': PRELOAD_NONE
    },
    PAGE_KEY_LIBRARY: {
        'url': '/library',
        'size_limits_mb': {
            'uncached': 6.5,
            'cached': 1.0,
        },
        'load_time_limits_secs': {
            'uncached': 10.0,
            'cached': 3.0,
        },
        'preload_options': PRELOAD_RELOAD_DEMO_EXPS
    },
    PAGE_KEY_CREATOR_DASHBOARD: {
        'url': '/creator_dashboard',
        'size_limits_mb': {
            'uncached': 8.0,
            'cached': 0.8,
        },
        'load_time_limits_secs': {
            'uncached': 10.0,
            'cached': 4.0,
        },
        'preload_options': PRELOAD_DO_LOGIN
    },
    PAGE_KEY_EXPLORATION_PLAYER: {
        'url': '/explore/0',
        'size_limits_mb': {
            'uncached': 8.0,
            'cached': 1.2,
        },
        'load_time_limits_secs': {
            'uncached': 10.0,
            'cached': 8.0
        },
        'preload_options': PRELOAD_RELOAD_FIRST_EXP
    },
    PAGE_KEY_EXPLORATION_EDITOR: {
        'url': '/create/0',
        'size_limits_mb': {
            'uncached': 12.0,
            'cached': 2.2,
        },
        'load_time_limits_secs': {
            'uncached': 15.0,
            'cached': 14.0,
        },
        'preload_options': PRELOAD_RELOAD_FIRST_EXP
    },
    PAGE_KEY_COLLECTION_PLAYER: {
        'url': '/collection/0',
        'size_limits_mb': {
            'uncached': 8.0,
            'cached': 0.9,
        },
        'load_time_limits_secs': {
            'uncached': 10.0,
            'cached': 5.0,
        },
        'preload_options': PRELOAD_LOAD_DEMO_COLLECTIONS
    },
    PAGE_KEY_PROFILE: {
        'url': '/profile/',
        'size_limits_mb': {
            'uncached': 7.0,
            'cached': 0.8,
        },
        'load_time_limits_secs': {
            'uncached': 10.0,
            'cached': 3.0,
        },
        'preload_options': PRELOAD_DO_LOGIN
    }
}
