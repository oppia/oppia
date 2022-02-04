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

"""Unit tests for jobs.types.model_property."""

from __future__ import annotations

import pickle

from core.jobs.types import model_property
from core.platform import models
from core.tests import test_utils

(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])

datastore_services = models.Registry.import_datastore_services()


class SubclassOfBaseModel(base_models.BaseModel):
    """Subclass of BaseModel with a StringProperty named 'value'."""

    value = datastore_services.StringProperty()


class SubclassOfNdbModel(datastore_services.Model):
    """Subclass of NDB Model with a StringProperty named 'value'."""

    value = datastore_services.StringProperty()


class RepeatedValueModel(base_models.BaseModel):
    """Subclass of BaseModel with a repeated StringProperty named 'values'."""

    values = datastore_services.StringProperty(repeated=True)


class ModelPropertyTests(test_utils.TestBase):

    def setUp(self):
        self.id_property = model_property.ModelProperty(
            SubclassOfBaseModel, SubclassOfBaseModel.id)
        self.ndb_property = model_property.ModelProperty(
            SubclassOfBaseModel, SubclassOfBaseModel.value)
        self.ndb_repeated_property = model_property.ModelProperty(
            RepeatedValueModel, RepeatedValueModel.values)

    def test_init_with_id_property(self):
        # Does not raise.
        model_property.ModelProperty(
            SubclassOfBaseModel, SubclassOfBaseModel.id)

    def test_init_with_ndb_property(self):
        # Does not raise.
        model_property.ModelProperty(
            SubclassOfBaseModel, SubclassOfBaseModel.value)

    def test_init_with_ndb_repeated_property(self):
        # Does not raise.
        model_property.ModelProperty(
            RepeatedValueModel, RepeatedValueModel.values)

    def test_init_raises_type_error_when_model_is_not_a_class(self):
        model = SubclassOfBaseModel()

        with self.assertRaisesRegexp(TypeError, 'not a model class'):
            model_property.ModelProperty(model, SubclassOfBaseModel.value)

    def test_init_raises_type_error_when_model_is_unrelated_to_base_model(self):
        with self.assertRaisesRegexp(TypeError, 'not a subclass of BaseModel'):
            model_property.ModelProperty(
                SubclassOfNdbModel, SubclassOfNdbModel.value)

    def test_init_raises_type_error_when_property_is_not_an_ndb_property(self):
        model = SubclassOfBaseModel(value='123')

        with self.assertRaisesRegexp(TypeError, 'not an NDB Property'):
            model_property.ModelProperty(SubclassOfBaseModel, model.value)

    def test_init_raises_value_error_when_property_is_not_in_model(self):
        with self.assertRaisesRegexp(ValueError, 'not a property of'):
            model_property.ModelProperty(
                SubclassOfBaseModel, SubclassOfNdbModel.value)

    def test_model_kind_of_id_property(self):
        self.assertEqual(self.id_property.model_kind, 'SubclassOfBaseModel')

    def test_model_kind_of_ndb_property(self):
        self.assertEqual(self.ndb_property.model_kind, 'SubclassOfBaseModel')

    def test_model_kind_of_ndb_repeated_property(self):
        self.assertEqual(
            self.ndb_repeated_property.model_kind, 'RepeatedValueModel')

    def test_property_name_of_id_property(self):
        self.assertEqual(self.id_property.property_name, 'id')

    def test_property_name_of_ndb_property(self):
        self.assertEqual(self.ndb_property.property_name, 'value')

    def test_property_name_of_ndb_repeated_property(self):
        self.assertEqual(self.ndb_repeated_property.property_name, 'values')

    def test_str_of_id_property(self):
        self.assertEqual(str(self.id_property), 'SubclassOfBaseModel.id')

    def test_str_of_ndb_property(self):
        self.assertEqual(str(self.ndb_property), 'SubclassOfBaseModel.value')

    def test_str_of_ndb_repeated_property(self):
        self.assertEqual(
            str(self.ndb_repeated_property), 'RepeatedValueModel.values')

    def test_repr_of_id_property(self):
        self.assertEqual(
            repr(self.id_property),
            'ModelProperty(SubclassOfBaseModel, SubclassOfBaseModel.id)')

    def test_repr_of_ndb_property(self):
        self.assertEqual(
            repr(self.ndb_property),
            'ModelProperty(SubclassOfBaseModel, SubclassOfBaseModel.value)')

    def test_repr_of_ndb_repeated_property(self):
        self.assertEqual(
            repr(self.ndb_repeated_property),
            'ModelProperty(RepeatedValueModel, RepeatedValueModel.values)')

    def test_equality(self):
        self.assertNotEqual(self.id_property, self.ndb_property)
        self.assertNotEqual(self.ndb_property, self.ndb_repeated_property)
        self.assertNotEqual(self.ndb_repeated_property, self.id_property)

        self.assertEqual(
            self.id_property,
            model_property.ModelProperty(
                SubclassOfBaseModel, SubclassOfBaseModel.id))
        self.assertEqual(
            self.ndb_property,
            model_property.ModelProperty(
                SubclassOfBaseModel, SubclassOfBaseModel.value))
        self.assertEqual(
            self.ndb_repeated_property,
            model_property.ModelProperty(
                RepeatedValueModel, RepeatedValueModel.values))

    def test_hash_of_id_property(self):
        id_property_set = {
            model_property.ModelProperty(
                SubclassOfBaseModel, SubclassOfBaseModel.id),
        }

        self.assertIn(self.id_property, id_property_set)
        self.assertNotIn(self.ndb_property, id_property_set)
        self.assertNotIn(self.ndb_repeated_property, id_property_set)

    def test_hash_of_ndb_property(self):
        ndb_property_set = {
            model_property.ModelProperty(
                SubclassOfBaseModel, SubclassOfBaseModel.value),
        }

        self.assertIn(self.ndb_property, ndb_property_set)
        self.assertNotIn(self.id_property, ndb_property_set)
        self.assertNotIn(self.ndb_repeated_property, ndb_property_set)

    def test_hash_of_ndb_repeated_property(self):
        ndb_repeated_property_set = {
            model_property.ModelProperty(
                RepeatedValueModel, RepeatedValueModel.values),
        }

        self.assertIn(self.ndb_repeated_property, ndb_repeated_property_set)
        self.assertNotIn(self.id_property, ndb_repeated_property_set)
        self.assertNotIn(self.ndb_property, ndb_repeated_property_set)

    def test_yield_value_from_id_property(self):
        model = SubclassOfBaseModel(id='123')

        self.assertEqual(
            list(self.id_property.yield_value_from_model(model)), ['123'])

    def test_yield_value_from_ndb_property(self):
        model = SubclassOfBaseModel(value='abc')

        self.assertEqual(
            list(self.ndb_property.yield_value_from_model(model)), ['abc'])

    def test_yield_value_from_ndb_repeated_property(self):
        model = RepeatedValueModel(values=['123', '456', '789'])

        self.assertEqual(
            list(self.ndb_repeated_property.yield_value_from_model(model)),
            ['123', '456', '789'])

    def test_yield_value_from_model_raises_type_error_if_not_right_kind(self):
        model = RepeatedValueModel(values=['123', '456', '789'])

        self.assertRaisesRegexp(
            TypeError, 'not an instance of SubclassOfBaseModel',
            lambda: list(self.ndb_property.yield_value_from_model(model)))

    def test_pickle_id_property(self):
        pickle_value = pickle.loads(pickle.dumps(self.id_property))

        self.assertEqual(self.id_property, pickle_value)
        self.assertIn(pickle_value, {self.id_property})

    def test_pickle_ndb_property(self):
        pickle_value = pickle.loads(pickle.dumps(self.ndb_property))

        self.assertEqual(self.ndb_property, pickle_value)
        self.assertIn(pickle_value, {self.ndb_property})

    def test_pickle_ndb_repeated_property(self):
        pickle_value = pickle.loads(pickle.dumps(self.ndb_repeated_property))

        self.assertEqual(self.ndb_repeated_property, pickle_value)
        self.assertIn(pickle_value, {self.ndb_repeated_property})
