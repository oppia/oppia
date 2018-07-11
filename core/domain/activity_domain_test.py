# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for methods in the action registry."""

from core.domain import activity_domain
from core.tests import test_utils


class ActivityReferenceDomainUnitTests(test_utils.GenericTestBase):
    """Tests for ActivityReference domain class."""

    def setUp(self):
        super(ActivityReferenceDomainUnitTests, self).setUp()
        self.exp_activity_reference = activity_domain.ActivityReference(
            'exploration', '1234')
        self.collection_activity_reference = activity_domain.ActivityReference(
            'collection', '1234')
        self.invalid_activity_reference = activity_domain.ActivityReference(
            'invalid_activity_type', '1234')

    def test_that_hashes_for_different_object_types_are_distinct(self):
        exp_hash = self.exp_activity_reference.get_hash()
        collection_hash = self.collection_activity_reference.get_hash()
        invalid_activity_hash = self.invalid_activity_reference.get_hash()
        self.assertNotEqual(exp_hash, collection_hash)
        self.assertNotEqual(exp_hash, invalid_activity_hash)
        self.assertNotEqual(collection_hash, invalid_activity_hash)

    def test_validate(self):
        with self.assertRaisesRegexp(Exception, 'Invalid activity type: .+'):
            self.invalid_activity_reference.validate()

    def test_to_dict(self):
        exp_dict = self.exp_activity_reference.to_dict()
        collection_dict = self.collection_activity_reference.to_dict()
        self.assertEqual(
            exp_dict,
            {
                'type': 'exploration',
                'id': '1234'
            }
        )
        self.assertEqual(
            collection_dict,
            {
                'type': 'collection',
                'id': '1234'
            }
        )
