# coding: utf-8
#
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

"""Tests for methods in the action registry."""

from __future__ import annotations

from core.domain import activity_domain
from core.tests import test_utils


class ActivityReferenceDomainUnitTests(test_utils.GenericTestBase):
    """Tests for ActivityReference domain class."""

    def setUp(self) -> None:
        super().setUp()
        self.exp_activity_reference = activity_domain.ActivityReference(
            'exploration', '1234')
        self.collection_activity_reference = activity_domain.ActivityReference(
            'collection', '1234')
        self.invalid_activity_reference_with_invalid_type = (
            activity_domain.ActivityReference('invalid_activity_type', '1234'))

    def test_that_hashes_for_different_object_types_are_distinct(self) -> None:
        exp_hash = self.exp_activity_reference.get_hash()
        collection_hash = self.collection_activity_reference.get_hash()
        invalid_activity_hash = (
            self.invalid_activity_reference_with_invalid_type.get_hash())
        self.assertNotEqual(exp_hash, collection_hash)
        self.assertNotEqual(exp_hash, invalid_activity_hash)
        self.assertNotEqual(collection_hash, invalid_activity_hash)

    def test_validate_with_invalid_type(self) -> None:
        with self.assertRaisesRegex(
            Exception, 'Invalid activity type: invalid_activity_type'):
            self.invalid_activity_reference_with_invalid_type.validate()

    def test_validate_with_invalid_id(self) -> None:
        # TODO(#13528): Here we use MyPy ignore because we remove this test
        # after the backend is fully type-annotated. Here ignore[arg-type]
        # is used to test the constructor of ActivityReference for invalid
        # argument type.
        invalid_activity_reference_with_invalid_id = (
            activity_domain.ActivityReference('exploration', 1234))  # type: ignore[arg-type]
        with self.assertRaisesRegex(
            Exception, ('Expected id to be a string but found 1234')):
            invalid_activity_reference_with_invalid_id.validate()

    def test_to_dict(self) -> None:
        exp_dict = self.exp_activity_reference.to_dict()
        collection_dict = self.collection_activity_reference.to_dict()
        self.assertEqual(
            exp_dict,
            {
                'type': 'exploration',
                'id': '1234'
            }
        )
        self.assertEqual(
            collection_dict,
            {
                'type': 'collection',
                'id': '1234'
            }
        )

    def test_from_dict(self) -> None:
        sample_dict = {
            'type': 'exploration',
            'id': '1234'
        }
        returned_activity_object = activity_domain.ActivityReference.from_dict(
            sample_dict)
        returned_activity_dict = returned_activity_object.to_dict()

        self.assertEqual(sample_dict, returned_activity_dict)
        self.assertEqual(sample_dict['type'], returned_activity_dict['type'])
        self.assertEqual(sample_dict['id'], returned_activity_dict['id'])


class ActivityReferencesDomainUnitTests(test_utils.GenericTestBase):
    """Tests for ActivityReferences domain class."""

    def setUp(self) -> None:
        super().setUp()
        exp_activity_reference = activity_domain.ActivityReference(
            'exploration', '1234')
        collection_activity_reference = activity_domain.ActivityReference(
            'collection', '1234')
        invalid_activity_reference = (
            activity_domain.ActivityReference(
                'invalid_activity_type', '1234'))
        self.valid_activity_references = (
            activity_domain.ActivityReferences([
                exp_activity_reference, collection_activity_reference]))
        self.invalid_activity_references = (
            activity_domain.ActivityReferences([
                exp_activity_reference, invalid_activity_reference]))

    def test_validate_passes_with_valid_activity_reference_list(self) -> None:
        self.valid_activity_references.validate()

    def test_validate_fails_with_invalid_type_in_activity_reference_list(
        self
    ) -> None:
        with self.assertRaisesRegex(
            Exception, 'Invalid activity type: invalid_activity_type'):
            self.invalid_activity_references.validate()
