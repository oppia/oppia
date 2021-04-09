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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import pickle

from core.platform import models
from core.tests import test_utils
from jobs.types import model_property
import python_utils

(base_models,) = models.Registry.import_models([models.NAMES.base_model])

datastore_services = models.Registry.import_datastore_services()


class SubclassOfBaseModel(base_models.BaseModel):
    """Subclass of BaseModel with a StringProperty named 'x'."""

    value = datastore_services.StringProperty()


class SubclassOfNdbModel(datastore_services.Model):
    """Subclass of NDB Model with a StringProperty named 'x'."""

    value = datastore_services.StringProperty()


class RepeatedValueModel(base_models.BaseModel):
    """Subclass of BaseModel with a repeated StringProperty named 'values'."""

    values = datastore_services.StringProperty(repeated=True)


class ModelPropertyTests(test_utils.TestBase):

    def setUp(self):
        self.model_property = model_property.ModelProperty(
            SubclassOfBaseModel, SubclassOfBaseModel.value)
        self.repeated_model_property = model_property.ModelProperty(
            RepeatedValueModel, RepeatedValueModel.values)

    def test_init_with_ndb_property(self):
        # Does not raise.
        model_property.ModelProperty(
            SubclassOfBaseModel, SubclassOfBaseModel.value)

    def test_init_with_base_model_id(self):
        # Does not raise.
        model_property.ModelProperty(
            SubclassOfBaseModel, SubclassOfBaseModel.id)

    def test_init_raises_type_error_when_model_is_not_a_type(self):
        foo_model = SubclassOfBaseModel()
        with self.assertRaisesRegexp(TypeError, 'not a model class'):
            model_property.ModelProperty(foo_model, foo_model.value)

    def test_init_raises_type_error_when_model_not_subclass_of_base_model(self):
        with self.assertRaisesRegexp(TypeError, 'not a subclass of BaseModel'):
            model_property.ModelProperty(
                SubclassOfNdbModel, SubclassOfNdbModel.value)

    def test_init_raises_type_error_when_property_is_not_ndb_property(self):
        with self.assertRaisesRegexp(TypeError, 'not a property'):
            model_property.ModelProperty(SubclassOfBaseModel, 'value')

    def test_init_raises_value_error_when_property_is_not_in_model(self):
        with self.assertRaisesRegexp(ValueError, 'not in properties of model'):
            model_property.ModelProperty(
                SubclassOfBaseModel, SubclassOfNdbModel.value)

    def test_kind(self):
        self.assertEqual(self.model_property.model_kind, 'SubclassOfBaseModel')

    def test_property_name(self):
        self.assertEqual(self.model_property.property_name, 'value')

    def test_str(self):
        self.assertEqual(
            python_utils.UNICODE(self.model_property),
            'SubclassOfBaseModel.value')

    def test_equality(self):
        self.assertNotEqual(self.model_property, self.repeated_model_property)
        self.assertEqual(
            self.model_property,
            model_property.ModelProperty(
                SubclassOfBaseModel, SubclassOfBaseModel.value))

    def test_hash(self):
        model_property_set = {
            model_property.ModelProperty(
                SubclassOfBaseModel, SubclassOfBaseModel.value),
        }

        self.assertIn(self.model_property, model_property_set)
        self.assertNotIn(self.repeated_model_property, model_property_set)

    def test_yield_value_from_model_with_property(self):
        model = SubclassOfBaseModel(value='abc')

        self.assertEqual(
            list(self.model_property.yield_value_from_model(model)), ['abc'])

    def test_yield_value_from_model_with_repeated_property(self):
        model = RepeatedValueModel(values=['123', '456', '789'])

        self.assertEqual(
            list(self.repeated_model_property.yield_value_from_model(model)),
            ['123', '456', '789'])

    def test_yield_value_from_model_raises_type_error_if_not_a_model(self):
        class FakeModel(python_utils.OBJECT):
            """Class that pretends to be a model."""

            def __init__(self, value):
                self.value = value

        model = FakeModel('abc')

        self.assertRaisesRegexp(
            TypeError, 'not an instance of SubclassOfBaseModel',
            lambda: list(self.model_property.yield_value_from_model(model)))

    def test_pickling(self):
        pickled_model_property, pickled_repeated_model_property = (
            pickle.dumps(self.model_property),
            pickle.dumps(self.repeated_model_property))
        unpickled_model_property, unpickled_repeated_model_property = (
            pickle.loads(pickled_model_property),
            pickle.loads(pickled_repeated_model_property))

        self.assertEqual(self.model_property, unpickled_model_property)
        self.assertIn(unpickled_model_property, {self.model_property})

        self.assertEqual(
            self.repeated_model_property, unpickled_repeated_model_property)
        self.assertIn(
            unpickled_repeated_model_property, {self.repeated_model_property})

        self.assertNotEqual(
            unpickled_model_property, unpickled_repeated_model_property)
