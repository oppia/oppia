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

"""Unit tests for audit_decorators."""

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


class AuditsExisting(audit_decorators.AuditsExisting):
    """Subclassed with overrides to avoid modifying the real decorator."""

    # Overrides the real value of _AUDITS_BY_KIND for the unit tests.
    _AUDITS_BY_KIND = collections.defaultdict(set)

    @classmethod
    def clear(cls):
        """Test-only helper method for clearing the decorator."""
        cls._AUDITS_BY_KIND.clear()

    @classmethod
    def get_audits(cls, kind):
        """Test-only helper method for getting a specific set of audits.

        Args:
            kind: str. The kind of model to filter by.

        Returns:
            set(DoFn). The set of audits.
        """
        return list(cls._AUDITS_BY_KIND[kind])


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
        AuditsExisting.clear()

    def test_has_no_do_fns_by_default(self):
        self.assertEqual(AuditsExisting.get_audits_by_kind(), {})

    def test_raises_value_error_when_given_no_args(self):
        self.assertRaisesRegexp(
            ValueError, 'Must target at least one model', AuditsExisting)

    def test_raises_type_error_when_given_unregistered_model(self):
        self.assertRaisesRegexp(
            TypeError, re.escape(
                '%r is not a model registered in core.platform' % FooModel),
            lambda: AuditsExisting(FooModel))

    def test_raises_type_error_when_decorating_non_do_fn_class(self):
        self.assertRaisesRegexp(
            TypeError, '%r is not a subclass of DoFn' % NotDoFn,
            lambda: AuditsExisting(base_models.BaseModel)(NotDoFn))

    def test_targets_every_subclass_when_a_base_model_is_targeted(self):
        self.assertIs(AuditsExisting(base_models.BaseModel)(DoFn), DoFn)

        self.assertItemsEqual(AuditsExisting.get_audits_by_kind().items(), [
            (cls.__name__, {DoFn}) for cls in [base_models.BaseModel] + (
                models.Registry.get_all_storage_model_classes())
        ])

    def test_replaces_base_do_fn_when_derived_do_fn_is_added_later(self):
        AuditsExisting(base_models.BaseModel)(DoFn)
        AuditsExisting(base_models.BaseModel)(UnrelatedDoFn)
        self.assertItemsEqual(
            AuditsExisting.get_audits('BaseModel'),
            [DoFn, UnrelatedDoFn])
        self.assertItemsEqual(
            AuditsExisting.get_audits('ExplorationModel'),
            [DoFn, UnrelatedDoFn])

        AuditsExisting(exp_models.ExplorationModel)(DerivedDoFn)
        self.assertItemsEqual(
            AuditsExisting.get_audits('BaseModel'),
            [DoFn, UnrelatedDoFn])
        self.assertItemsEqual(
            AuditsExisting.get_audits('ExplorationModel'),
            [DerivedDoFn, UnrelatedDoFn])

    def test_keeps_derived_do_fn_when_base_do_fn_is_added_later(self):
        AuditsExisting(exp_models.ExplorationModel)(DerivedDoFn)
        AuditsExisting(exp_models.ExplorationModel)(UnrelatedDoFn)
        self.assertItemsEqual(
            AuditsExisting.get_audits('BaseModel'),
            [])
        self.assertItemsEqual(
            AuditsExisting.get_audits('ExplorationModel'),
            [DerivedDoFn, UnrelatedDoFn])

        AuditsExisting(base_models.BaseModel)(DoFn)
        self.assertItemsEqual(
            AuditsExisting.get_audits('BaseModel'),
            [DoFn])
        self.assertItemsEqual(
            AuditsExisting.get_audits('ExplorationModel'),
            [DerivedDoFn, UnrelatedDoFn])

    def test_does_not_register_duplicate_do_fns(self):
        AuditsExisting(base_models.BaseModel)(DoFn)
        self.assertItemsEqual(AuditsExisting.get_audits('BaseModel'), [DoFn])

        AuditsExisting(base_models.BaseModel)(DoFn)
        self.assertItemsEqual(AuditsExisting.get_audits('BaseModel'), [DoFn])
