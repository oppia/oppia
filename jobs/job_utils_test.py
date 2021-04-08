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

"""Unit tests for jobs.job_utils."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
from core.tests import test_utils
from jobs import job_utils

from google.cloud import datastore as cloud_datastore_types

(base_models,) = models.Registry.import_models([models.NAMES.base_model])

datastore_services = models.Registry.import_datastore_services()


class FooModel(base_models.BaseModel):
    """Simple BaseModel subclass with a 'prop' string property."""

    prop = datastore_services.StringProperty()


class CloneTests(test_utils.TestBase):

    def test_clone_model(self):
        model = base_models.BaseModel(id='123', deleted=True)
        clone = job_utils.clone_model(model)

        self.assertEqual(model.id, clone.id)
        self.assertEqual(model, clone)
        self.assertIsNot(model, clone)
        self.assertIsInstance(clone, base_models.BaseModel)

    def test_clone_with_changes(self):
        model = base_models.BaseModel(id='123', deleted=True)
        clone = job_utils.clone_model(model, deleted=False)

        self.assertNotEqual(model, clone)
        self.assertIsNot(model, clone)
        self.assertIsInstance(clone, base_models.BaseModel)
        self.assertTrue(model.deleted)
        self.assertFalse(clone.deleted)

    def test_clone_with_changes_to_id(self):
        model = base_models.BaseModel(id='123')
        clone = job_utils.clone_model(model, id='124')

        self.assertNotEqual(model, clone)
        self.assertIsNot(model, clone)
        self.assertIsInstance(clone, base_models.BaseModel)
        self.assertEqual(model.id, '123')
        self.assertEqual(clone.id, '124')

    def test_clone_sub_class(self):
        model = FooModel(id='123', prop='original')
        clone = job_utils.clone_model(model)

        self.assertEqual(model, clone)
        self.assertIsNot(model, clone)
        self.assertIsInstance(clone, FooModel)
        self.assertEqual(model.prop, 'original')
        self.assertEqual(clone.prop, 'original')

    def test_clone_sub_class_with_changes(self):
        model = FooModel(id='123', prop='original')
        clone = job_utils.clone_model(model, prop='updated')

        self.assertNotEqual(model, clone)
        self.assertIsNot(model, clone)
        self.assertIsInstance(clone, FooModel)
        self.assertEqual(model.prop, 'original')
        self.assertEqual(clone.prop, 'updated')


class GetModelKindTests(test_utils.TestBase):

    def test_get_from_datastore_model(self):
        model = base_models.BaseModel()
        self.assertEqual(job_utils.get_model_kind(model), 'BaseModel')

    def test_get_from_datastore_model_class(self):
        self.assertEqual(
            job_utils.get_model_kind(base_models.BaseModel), 'BaseModel')

    def test_get_from_cloud_datastore_entity(self):
        entity = cloud_datastore_types.Entity(
            key=cloud_datastore_types.Key('BaseModel', '123', project='foo'))
        self.assertEqual(job_utils.get_model_kind(entity), 'BaseModel')

    def test_get_from_bad_value(self):
        self.assertRaisesRegexp(
            TypeError, 'not a model type',
            lambda: job_utils.get_model_kind(123))
