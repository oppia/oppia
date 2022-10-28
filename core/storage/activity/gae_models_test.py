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

"""Tests for core.storage.activity.gae_models."""

from __future__ import annotations

from core.constants import constants
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import activity_models
    from mypy_imports import base_models

(base_models, activity_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.ACTIVITY
])


class ActivityListModelTest(test_utils.GenericTestBase):
    """Tests the ActivityListModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            activity_models.ActivityReferencesModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            activity_models.ActivityReferencesModel.
                get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_get_export_policy(self) -> None:
        sample_dict = base_models.BaseModel.get_export_policy()
        sample_dict.update(
            {'activity_references': base_models.EXPORT_POLICY.NOT_APPLICABLE})
        self.assertEqual(
            activity_models.ActivityReferencesModel.get_export_policy(),
            sample_dict)

    def test_featured_activity_list_always_exists(self) -> None:
        featured_model_instance = (
            activity_models.ActivityReferencesModel.get_or_create('featured'))
        self.assertIsNotNone(featured_model_instance)
        self.assertEqual(featured_model_instance.id, 'featured')
        self.assertEqual(featured_model_instance.activity_references, [])

    def test_retrieving_non_existent_list(self) -> None:
        with self.assertRaisesRegex(Exception, 'Invalid ActivityListModel'):
            activity_models.ActivityReferencesModel.get_or_create(
                'nonexistent_key')

    def test_updating_featured_activity_list(self) -> None:
        featured_model_instance = (
            activity_models.ActivityReferencesModel.get_or_create('featured'))
        self.assertEqual(featured_model_instance.activity_references, [])

        featured_model_instance.activity_references = [{
            'type': constants.ACTIVITY_TYPE_EXPLORATION,
            'id': '0',
        }]
        featured_model_instance.update_timestamps()
        featured_model_instance.put()

        featured_model_instance = (
            activity_models.ActivityReferencesModel.get_or_create('featured'))
        self.assertEqual(featured_model_instance.id, 'featured')
        self.assertEqual(
            featured_model_instance.activity_references, [{
                'type': constants.ACTIVITY_TYPE_EXPLORATION,
                'id': '0',
            }])
