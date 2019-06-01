# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Tests for the analytics controller."""

from core.tests import test_utils
import feconf

class AnalyticsHandlerTests(test_utils.GenericTestBase):
    
    def test_analytics_handler_returns_required_values(self):
        
        values_dict = {
            'analytics_id': 'test123',
            'site_name_for_analytics': 'Oppia foundation'
        }

        with self.swap(feconf, 'ANALYTICS_ID', 'test123'):
            with self.swap(feconf, 'SITE_NAME_FOR_ANALYTICS', 'Oppia foundation'):
                response = self.get_json(feconf.ANALYTICS_DATA_URL)
                self.assertEqual(response, values_dict)
