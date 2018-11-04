# coding: utf-8
#
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

from constants import constants
from core.platform import models
from core.tests import test_utils

(activity_models,) = models.Registry.import_models([models.NAMES.activity])


class ActivityListModelTest(test_utils.GenericTestBase):
    """Tests the ActivityListModel class."""

    def test_featured_activity_list_always_exists(self):
        featured_model_instance = (
            activity_models.ActivityReferencesModel.get_or_create('featured'))
        self.assertIsNotNone(featured_model_instance)
        self.assertEqual(featured_model_instance.id, 'featured')
        self.assertEqual(featured_model_instance.activity_references, [])

    def test_retrieving_non_existent_list(self):
        with self.assertRaisesRegexp(Exception, 'Invalid ActivityListModel'):
            activity_models.ActivityReferencesModel.get_or_create(
                'nonexistent_key')

    def test_updating_featured_activity_list(self):
        featured_model_instance = (
            activity_models.ActivityReferencesModel.get_or_create('featured'))
        self.assertEqual(featured_model_instance.activity_references, [])

        featured_model_instance.activity_references = [{
            'type': constants.ACTIVITY_TYPE_EXPLORATION,
            'id': '0',
        }]
        featured_model_instance.put()

        featured_model_instance = (
            activity_models.ActivityReferencesModel.get_or_create('featured'))
        self.assertEqual(featured_model_instance.id, 'featured')
        self.assertEqual(
            featured_model_instance.activity_references, [{
                'type': constants.ACTIVITY_TYPE_EXPLORATION,
                'id': '0',
            }])
