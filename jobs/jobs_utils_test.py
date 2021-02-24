# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Tests for functions for beam validators and one-off jobs."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import unittest

from core.platform import models
from jobs import jobs_utils

(base_models, user_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.user])

datastore_services = models.Registry.import_datastore_services()


class CloneTests(unittest.TestCase):

    def test_clone_model(self):
        model = base_models.BaseModel(id='123', deleted=True)
        clone = jobs_utils.clone_model(model)

        self.assertEqual(model.id, clone.id)
        self.assertEqual(model, clone)
        self.assertIsNot(model, clone)
        self.assertIsInstance(clone, base_models.BaseModel)

    def test_clone_with_changes(self):
        model = base_models.BaseModel(id='123', deleted=True)
        clone = jobs_utils.clone_model(model, deleted=False)

        self.assertNotEqual(model, clone)
        self.assertIsNot(model, clone)
        self.assertIsInstance(clone, base_models.BaseModel)
        self.assertTrue(model.deleted)
        self.assertFalse(clone.deleted)

    def test_clone_sub_class(self):
        class DerivedModel(base_models.BaseModel):
            """Simple model with an extra 'field' string property."""

            field = datastore_services.StringProperty()

        model = DerivedModel(id='123', field='original')
        clone = jobs_utils.clone_model(model)

        self.assertEqual(model, clone)
        self.assertIsNot(model, clone)
        self.assertIsInstance(clone, DerivedModel)
        self.assertEqual(model.field, 'original')
        self.assertEqual(clone.field, 'original')

    def test_clone_sub_class_with_changes(self):
        class DerivedModel(base_models.BaseModel):
            """Simple model with an extra 'field' string property."""

            field = datastore_services.StringProperty()

        model = DerivedModel(id='123', field='original')
        clone = jobs_utils.clone_model(model, field='updated')

        self.assertNotEqual(model, clone)
        self.assertIsNot(model, clone)
        self.assertIsInstance(clone, DerivedModel)
        self.assertEqual(model.field, 'original')
        self.assertEqual(clone.field, 'updated')
