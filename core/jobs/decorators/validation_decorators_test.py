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

"""Unit tests for jobs.decorators.validation_decorators."""

from __future__ import annotations

import collections
import re

from core.jobs.decorators import validation_decorators
from core.jobs.types import model_property
from core.platform import models
from core.tests import test_utils

import apache_beam as beam

base_models, exp_models = models.Registry.import_models(
    [models.Names.BASE_MODEL, models.Names.EXPLORATION])

datastore_services = models.Registry.import_datastore_services()


class MockAuditsExisting(validation_decorators.AuditsExisting):
    """Subclassed with overrides to avoid modifying the real decorator."""

    # Overrides the real value of _DO_FN_TYPES_BY_KIND for the unit tests.
    _DO_FN_TYPES_BY_KIND = collections.defaultdict(set)

    @classmethod
    def get_audit_do_fn_types(cls, kind):
        """Test-only helper for getting the DoFns of a specific kind of a model.

        Args:
            kind: str. The kind of model.

        Returns:
            frozenset(type(DoFn)). The set of audits.
        """
        return frozenset(cls._DO_FN_TYPES_BY_KIND[kind])

    @classmethod
    def clear(cls):
        """Test-only helper method for clearing the decorator."""
        cls._DO_FN_TYPES_BY_KIND.clear()


class DoFn(beam.DoFn):
    """Simple DoFn that does nothing."""

    def process(self, unused_item):
        """Does nothing."""
        pass


class UnrelatedDoFn(beam.DoFn):
    """Simple DoFn that does nothing."""

    def process(self, unused_item):
        """Does nothing."""
        pass


class DerivedDoFn(DoFn):
    """Simple DoFn that derives from another."""

    def process(self, unused_item):
        """Does nothing."""
        pass


class NotDoFn:
    """Class that does not inherit from DoFn."""

    def process(self, unused_item):
        """Does nothing."""
        pass


class FooModel(base_models.BaseModel):
    """A model that is not registered in core.platform."""

    pass


class BarModel(base_models.BaseModel):
    """A model that holds a reference to a FooModel ID."""

    BAR_CONSTANT = 1

    foo_id = datastore_services.StringProperty()


class BazModel(base_models.BaseModel):
    """A model that holds a reference to a BarModel ID and a FooModel ID."""

    foo_id = datastore_services.StringProperty()
    bar_id = datastore_services.StringProperty()


class AuditsExistingTests(test_utils.TestBase):

    def tearDown(self):
        super(AuditsExistingTests, self).tearDown()
        MockAuditsExisting.clear()

    def test_has_no_do_fns_by_default(self):
        self.assertEqual(MockAuditsExisting.get_audit_do_fn_types_by_kind(), {})

    def test_targets_every_subclass_when_a_base_model_is_targeted(self):
        self.assertIs(MockAuditsExisting(base_models.BaseModel)(DoFn), DoFn)

        self.assertItemsEqual(
            MockAuditsExisting.get_audit_do_fn_types_by_kind().items(),
            [(cls.__name__, {DoFn}) for cls in [base_models.BaseModel] + (
                models.Registry.get_all_storage_model_classes())
            ])

    def test_replaces_base_do_fn_when_derived_do_fn_is_added_later(self):
        MockAuditsExisting(base_models.BaseModel)(DoFn)
        MockAuditsExisting(base_models.BaseModel)(UnrelatedDoFn)
        self.assertItemsEqual(
            MockAuditsExisting.get_audit_do_fn_types('BaseModel'),
            [DoFn, UnrelatedDoFn])
        self.assertItemsEqual(
            MockAuditsExisting.get_audit_do_fn_types('ExplorationModel'),
            [DoFn, UnrelatedDoFn])

        MockAuditsExisting(exp_models.ExplorationModel)(DerivedDoFn)
        self.assertItemsEqual(
            MockAuditsExisting.get_audit_do_fn_types('BaseModel'),
            [DoFn, UnrelatedDoFn])
        self.assertItemsEqual(
            MockAuditsExisting.get_audit_do_fn_types('ExplorationModel'),
            [DerivedDoFn, UnrelatedDoFn])

    def test_keeps_derived_do_fn_when_base_do_fn_is_added_later(self):
        MockAuditsExisting(exp_models.ExplorationModel)(DerivedDoFn)
        MockAuditsExisting(exp_models.ExplorationModel)(UnrelatedDoFn)
        self.assertItemsEqual(
            MockAuditsExisting.get_audit_do_fn_types('BaseModel'),
            [])
        self.assertItemsEqual(
            MockAuditsExisting.get_audit_do_fn_types('ExplorationModel'),
            [DerivedDoFn, UnrelatedDoFn])

        MockAuditsExisting(base_models.BaseModel)(DoFn)
        self.assertItemsEqual(
            MockAuditsExisting.get_audit_do_fn_types('BaseModel'),
            [DoFn])
        self.assertItemsEqual(
            MockAuditsExisting.get_audit_do_fn_types('ExplorationModel'),
            [DerivedDoFn, UnrelatedDoFn])

    def test_does_not_register_duplicate_do_fns(self):
        MockAuditsExisting(base_models.BaseModel)(DoFn)
        self.assertItemsEqual(
            MockAuditsExisting.get_audit_do_fn_types('BaseModel'), [DoFn])

        MockAuditsExisting(base_models.BaseModel)(DoFn)
        self.assertItemsEqual(
            MockAuditsExisting.get_audit_do_fn_types('BaseModel'), [DoFn])

    def test_raises_value_error_when_given_no_args(self):
        with self.assertRaisesRegex(
            ValueError, 'Must target at least one model'
        ):
            MockAuditsExisting()

    def test_raises_type_error_when_given_unregistered_model(self):
        with self.assertRaisesRegex(
            TypeError, re.escape(
                '%r is not a model registered in core.platform' % FooModel),
        ):
            MockAuditsExisting(FooModel)

    def test_raises_type_error_when_decorating_non_do_fn_class(self):
        with self.assertRaisesRegex(
            TypeError, '%r is not a subclass of DoFn' % NotDoFn,
        ):
            MockAuditsExisting(base_models.BaseModel)(NotDoFn)


class MockRelationshipsOf(validation_decorators.RelationshipsOf):
    """Subclassed with overrides to avoid modifying the real decorator."""

    # Overrides the real value for the unit tests.
    _ID_REFERENCING_PROPERTIES = collections.defaultdict(set)

    @classmethod
    def clear(cls):
        """Test-only helper method for clearing the decorator."""
        cls._ID_REFERENCING_PROPERTIES.clear()


class RelationshipsOfTests(test_utils.TestBase):

    def tearDown(self):
        super(RelationshipsOfTests, self).tearDown()
        MockRelationshipsOf.clear()

    def get_property_of(self, model_class, property_name):
        """Helper method to create a ModelProperty.

        Args:
            model_class: *. A subclass of BaseModel.
            property_name: str. The name of the property to get.

        Returns:
            ModelProperty. An object that encodes both property and the model it
            belongs to.
        """
        return model_property.ModelProperty(
            model_class, getattr(model_class, property_name))

    def test_has_no_relationships_by_default(self):
        self.assertEqual(
            MockRelationshipsOf
            .get_id_referencing_properties_by_kind_of_possessor(), {})
        self.assertEqual(
            MockRelationshipsOf.get_all_model_kinds_referenced_by_properties(),
            set())

    def test_valid_relationship_generator(self):
        @MockRelationshipsOf(BarModel)
        def bar_model_relationships(model): # pylint: disable=unused-variable
            """Defines the relationships of BarModel."""
            yield (model.foo_id, [FooModel])

        self.assertEqual(
            MockRelationshipsOf
            .get_id_referencing_properties_by_kind_of_possessor(), {
                'BarModel': (
                    (self.get_property_of(BarModel, 'foo_id'), ('FooModel',)),
                ),
            })
        self.assertEqual(
            MockRelationshipsOf.get_model_kind_references('BarModel', 'foo_id'),
            {'FooModel'})
        self.assertEqual(
            MockRelationshipsOf.get_all_model_kinds_referenced_by_properties(),
            {'FooModel'})

    def test_accepts_id_as_property(self):
        @MockRelationshipsOf(BarModel)
        def bar_model_relationships(model): # pylint: disable=unused-variable
            """Defines the relationships of BarModel."""
            yield (model.id, [BazModel])

        self.assertEqual(
            MockRelationshipsOf
            .get_id_referencing_properties_by_kind_of_possessor(), {
                'BarModel': (
                    (self.get_property_of(BarModel, 'id'), ('BazModel',)),
                ),
            })
        self.assertEqual(
            MockRelationshipsOf.get_model_kind_references('BarModel', 'id'),
            {'BazModel'})
        self.assertEqual(
            MockRelationshipsOf.get_all_model_kinds_referenced_by_properties(),
            {'BazModel'})

    def test_rejects_values_that_are_not_types(self):
        foo_model = FooModel()

        with self.assertRaisesRegex(TypeError, 'is an instance, not a type'):
            MockRelationshipsOf(foo_model)

    def test_rejects_types_that_are_not_models(self):
        with self.assertRaisesRegex(TypeError, 'not a subclass of BaseModel'):
            MockRelationshipsOf(int)

    def test_rejects_relationship_generator_with_wrong_name(self):
        with self.assertRaisesRegex(ValueError, 'Please rename the function'):
            @MockRelationshipsOf(BarModel)
            def unused_bar_model_relationships(unused_model):
                """Defines the relationships of BarModel."""
                yield (BarModel.foo_id, [FooModel])
