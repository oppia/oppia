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

"""Tests for the translatable object registry."""

from __future__ import annotations

from core.domain import translatable_object_registry
from core.tests import test_utils
from extensions.objects.models import objects


class TranslatableObjectRegistryUnitTests(test_utils.GenericTestBase):
    """Test the Registry class in translatable_object_registry."""

    def test_get_object_class_method(self) -> None:
        """Tests the normal behavior of get_object_class()."""
        retrieved_class = (
            translatable_object_registry.Registry.get_object_class(
                'TranslatableHtml'))
        self.assertEqual(retrieved_class.__name__, 'TranslatableHtml')

    def test_nontranslatable_class_is_not_gettable(self) -> None:
        """Tests that trying to retrieve a non-translatable class raises an
        error.
        """
        with self.assertRaisesRegex(
            TypeError, 'not a valid translatable object class'
        ):
            # TODO(#13059): Here we use MyPy ignore because after we fully type
            # the codebase we plan to get rid of the tests that intentionally
            # test wrong inputs that we can normally catch by typing.
            translatable_object_registry.Registry.get_object_class( # type: ignore[call-overload]
                'Int')

    def test_fake_class_is_not_gettable(self) -> None:
        """Tests that trying to retrieve a fake class raises an error."""
        with self.assertRaisesRegex(
            TypeError, 'not a valid translatable object class'):
            # TODO(#13059): Here we use MyPy ignore because after we fully type
            # the codebase we plan to get rid of the tests that intentionally
            # test wrong inputs that we can normally catch by typing.
            translatable_object_registry.Registry.get_object_class( # type: ignore[call-overload]
                'FakeClass')

    def test_base_objects_are_not_gettable(self) -> None:
        """Tests that the base objects exist but are not included in the
        registry.
        """
        assert getattr(objects, 'BaseObject')
        with self.assertRaisesRegex(
            TypeError, 'not a valid translatable object class'):
            # TODO(#13059): Here we use MyPy ignore because after we fully type
            # the codebase we plan to get rid of the tests that intentionally
            # test wrong inputs that we can normally catch by typing.
            translatable_object_registry.Registry.get_object_class( # type: ignore[call-overload]
                'BaseObject')

        assert getattr(objects, 'BaseTranslatableObject')
        with self.assertRaisesRegex(
            TypeError, 'not a valid translatable object class'):
            # TODO(#13059): Here we use MyPy ignore because after we fully type
            # the codebase we plan to get rid of the tests that intentionally
            # test wrong inputs that we can normally catch by typing.
            translatable_object_registry.Registry.get_object_class( # type: ignore[call-overload]
                'BaseTranslatableObject')

    def test_get_translatable_object_classes(self) -> None:
        """Tests the normal behavior of get_translatable_object_classes()."""
        class_names_to_classes = (
            translatable_object_registry.Registry.get_all_class_names())
        self.assertEqual(class_names_to_classes, [
            'TranslatableHtml', 'TranslatableSetOfNormalizedString',
            'TranslatableSetOfUnicodeString', 'TranslatableUnicodeString'])
