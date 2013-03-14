# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

__author__ = 'Jeremy Emerson'

from statistics import Counter, Journal
import test_utils


class StatisticsUnitTests(test_utils.AppEngineTestBase):
    """Test the exploration model."""

    def testCounterClass(self):
        """Test Counter Class."""
        o = Counter()
        o.name = 'The name'
        o.value = 2
        self.assertEqual(o.name, 'The name')
        self.assertEqual(o.value, 2)

    def testJournalClass(self):
        """Test Journal Class."""
        o = Journal()
        o.name = 'The name'
        o.values = ['The values']
        self.assertEqual(o.name, 'The name')
        self.assertEqual(o.values, ['The values'])
