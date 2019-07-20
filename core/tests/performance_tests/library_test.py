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

"""Performance tests for the library page."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import division  # pylint: disable=import-only-modules
from __future__ import print_function  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import os
import sys

from core.tests.performance_tests import base
from core.tests.performance_tests import test_config

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_FUTURE_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'future-0.17.1')

sys.path.insert(0, _FUTURE_PATH)

# pylint: disable=wrong-import-position
# pylint: disable=wrong-import-order
from future import standard_library  # isort:skip

standard_library.install_aliases()
# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position


class LibraryPagePerformanceTest(base.TestBase):
    """Performance tests for the library page."""
    PAGE_KEY = test_config.PAGE_KEY_LIBRARY

    def setUp(self):
        super(LibraryPagePerformanceTest, self).setUp()

        page_config = test_config.TEST_DATA[self.PAGE_KEY]
        self._set_page_config(page_config)

        self._initialize_data_fetcher()
        self._load_page_to_cache_server_resources()

    def test_page_size_under_specified_limit(self):
        self._test_total_page_size()

    def test_page_size_under_specified_limit_for_cached_session(self):
        self._test_total_page_size_for_cached_session()

    def test_page_loads_under_specified_limit(self):
        self._test_page_load_time()

    def test_page_loads_under_specified_limit_cached_session(self):
        self._test_page_load_time_for_cached_session()
