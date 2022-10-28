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

"""Unit tests for jobs.transforms.base_validation_registry."""

from __future__ import annotations

from core.jobs.decorators import validation_decorators
from core.jobs.transforms.validation import base_validation_registry
from core.tests import test_utils


class GetAuditsByKindTests(test_utils.TestBase):

    unique_obj = object()

    # Here we use object because we need to mock the behavior of
    # 'base_validation_registry.get_audit_do_fn_types_by_kind' method.
    @classmethod
    def get_audit_do_fn_types_by_kind_mock(cls) -> object:
        """Returns the unique_obj."""
        return cls.unique_obj

    def test_returns_value_from_decorator(self) -> None:
        get_audit_do_fn_types_by_kind_swap = self.swap(
            validation_decorators.AuditsExisting,
            'get_audit_do_fn_types_by_kind',
            self.get_audit_do_fn_types_by_kind_mock)

        with get_audit_do_fn_types_by_kind_swap:
            self.assertIs(
                base_validation_registry.get_audit_do_fn_types_by_kind(),
                self.unique_obj)


class GetIdReferencingPropertiesByKindOfPossessorTests(test_utils.TestBase):

    unique_obj = object()

    # Here we use object because we need to mock the behavior of
    # 'get_id_referencing_properties_by_kind_of_possessor' method of
    # base_validation_registry.
    @classmethod
    def get_id_referencing_properties_by_kind_of_possessor_mock(cls) -> object:
        """Returns the unique_obj."""
        return cls.unique_obj

    def test_returns_value_from_decorator(self) -> None:
        get_id_referencing_properties_by_kind_of_possessor_swap = self.swap(
            validation_decorators.RelationshipsOf,
            'get_id_referencing_properties_by_kind_of_possessor',
            self.get_id_referencing_properties_by_kind_of_possessor_mock)

        with get_id_referencing_properties_by_kind_of_possessor_swap:
            self.assertIs(
                base_validation_registry
                .get_id_referencing_properties_by_kind_of_possessor(),
                self.unique_obj)


class GetAllModelKindsReferencedByPropertiesTests(test_utils.TestBase):

    unique_obj = object()

    # Here we use object because we need to mock the behavior of
    # 'get_all_model_kinds_referenced_by_properties' method of
    # base_validation_registry.
    @classmethod
    def get_all_model_kinds_referenced_by_properties_mock(cls) -> object:
        """Returns the unique_obj."""
        return cls.unique_obj

    def test_returns_value_from_decorator(self) -> None:
        get_all_model_kinds_referenced_by_properties_swap = self.swap(
            validation_decorators.RelationshipsOf,
            'get_all_model_kinds_referenced_by_properties',
            self.get_all_model_kinds_referenced_by_properties_mock)

        with get_all_model_kinds_referenced_by_properties_swap:
            self.assertIs(
                base_validation_registry
                .get_all_model_kinds_referenced_by_properties(),
                self.unique_obj)
