# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for Oppia storage models."""

from __future__ import annotations

import re

from core.domain import takeout_service
from core.platform import models
from core.tests import test_utils

from typing import Iterator, Type

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models

(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])


class StorageModelsTest(test_utils.GenericTestBase):
    """Tests for Oppia storage models."""

    def _get_base_or_versioned_model_child_classes(
        self
    ) -> Iterator[Type[base_models.BaseModel]]:
        """Get child model classes that inherit directly from BaseModel or
        VersionedModel, these are classes that are used directly for saving data
        and not just inherited from.
        """

        for clazz in test_utils.get_storage_model_classes():
            if (clazz.__name__ in
                    test_utils.BASE_MODEL_CLASSES_WITHOUT_DATA_POLICIES):
                continue
            yield clazz

    def test_all_model_module_names_unique(self) -> None:
        names_of_ndb_model_subclasses = [
            clazz.__name__ for clazz in test_utils.get_storage_model_classes()]

        self.assertEqual(
            len(set(names_of_ndb_model_subclasses)),
            len(names_of_ndb_model_subclasses))

    def test_base_or_versioned_child_classes_have_get_deletion_policy(
        self
    ) -> None:
        for clazz in self._get_base_or_versioned_model_child_classes():
            try:
                self.assertIn(
                    clazz.get_deletion_policy(), base_models.DELETION_POLICY)
            except NotImplementedError:
                self.fail(msg='get_deletion_policy is not defined for %s' % (
                    clazz.__name__))

    def test_base_or_versioned_child_classes_have_has_reference_to_user_id(
        self
    ) -> None:
        for clazz in self._get_base_or_versioned_model_child_classes():
            if (clazz.get_deletion_policy() ==
                    base_models.DELETION_POLICY.NOT_APPLICABLE):
                with self.assertRaisesRegex(
                    NotImplementedError,
                    re.escape(
                        'The has_reference_to_user_id() method is missing from '
                        'the derived class. It should be implemented in the '
                        'derived class.'
                    )
                ):
                    clazz.has_reference_to_user_id('any_id')
            else:
                try:
                    self.assertIsNotNone(
                        clazz.has_reference_to_user_id('any_id'))
                except NotImplementedError:
                    self.fail(
                        msg='has_reference_to_user_id is not defined for %s' % (
                            clazz.__name__))

    def test_get_models_which_should_be_exported(self) -> None:
        """Ensure that the set of models to export is the set of models with
        export policy CONTAINS_USER_DATA, and that all other models have
        export policy NOT_APPLICABLE.
        """
        all_models = [
            clazz
            for clazz in test_utils.get_storage_model_classes()
            if (not clazz.__name__ in
                test_utils.BASE_MODEL_CLASSES_WITHOUT_DATA_POLICIES)
        ]
        models_with_export = (
            takeout_service.get_models_which_should_be_exported())
        for model in all_models:
            export_policy = model.get_export_policy()
            if model in models_with_export:
                self.assertIn(
                    base_models.EXPORT_POLICY.EXPORTED, export_policy.values())
            else:
                self.assertNotIn(
                    base_models.EXPORT_POLICY.EXPORTED, export_policy.values())

    def test_all_fields_have_export_policy(self) -> None:
        """Ensure every field in every model has an export policy defined."""
        all_models = [
            clazz
            for clazz in test_utils.get_storage_model_classes()
            if (not clazz.__name__ in
                test_utils.BASE_MODEL_CLASSES_WITHOUT_DATA_POLICIES)
        ]
        for model in all_models:
            export_policy = model.get_export_policy()
            self.assertEqual(
                sorted([str(prop) for prop in model._properties]), # pylint: disable=protected-access
                sorted(export_policy.keys())
            )
            self.assertTrue(
                set(export_policy.values()).issubset(
                    {
                        base_models.EXPORT_POLICY.EXPORTED,
                        (
                            base_models
                            .EXPORT_POLICY.EXPORTED_AS_KEY_FOR_TAKEOUT_DICT),
                        base_models.EXPORT_POLICY.NOT_APPLICABLE
                    })
            )
