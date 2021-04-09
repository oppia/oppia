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

"""Unit tests for jobs.decorators.audit_decorators."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import collections
import re

from core.platform import models
from core.tests import test_utils
from jobs.decorators import audit_decorators
import python_utils

import apache_beam as beam

base_models, exp_models = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.exploration])


class MockAuditsExisting(audit_decorators.AuditsExisting):
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


class NotDoFn(python_utils.OBJECT):
    """Class that does not inherit from DoFn."""

    def process(self, unused_item):
        """Does nothing."""
        pass


class FooModel(base_models.BaseModel):
    """A model that is not registered in core.platform."""

    pass


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
        self.assertRaisesRegexp(
            ValueError, 'Must target at least one model', MockAuditsExisting)

    def test_raises_type_error_when_given_unregistered_model(self):
        self.assertRaisesRegexp(
            TypeError, re.escape(
                '%r is not a model registered in core.platform' % FooModel),
            lambda: MockAuditsExisting(FooModel))

    def test_raises_type_error_when_decorating_non_do_fn_class(self):
        self.assertRaisesRegexp(
            TypeError, '%r is not a subclass of DoFn' % NotDoFn,
            lambda: MockAuditsExisting(base_models.BaseModel)(NotDoFn))
