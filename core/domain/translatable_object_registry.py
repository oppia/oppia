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

"""Registry for translatable objects."""

from __future__ import annotations

import inspect

from extensions.objects.models import objects

from typing import Dict, List, Literal, Type, Union, overload

TranslatableObjectNames = Literal[
    'TranslatableHtml',
    'TranslatableUnicodeString',
    'TranslatableSetOfUnicodeString',
    'TranslatableSetOfNormalizedString',
]

TranslatableObjectClasses = Union[
    Type[objects.TranslatableHtml],
    Type[objects.TranslatableUnicodeString],
    Type[objects.TranslatableSetOfUnicodeString],
    Type[objects.TranslatableSetOfNormalizedString],
]


class Registry:
    """Registry of all translatable objects."""

    # Dict mapping object class names to their classes.
    _translatable_objects_dict: Dict[
        TranslatableObjectNames, TranslatableObjectClasses
    ] = {}

    @classmethod
    def _refresh_registry(cls) -> None:
        """Refreshes the registry by adding new translatable object classes
        to the registry.
        """
        cls._translatable_objects_dict.clear()

        # Add new object instances to the registry.
        for name, clazz in inspect.getmembers(
                objects, predicate=inspect.isclass):
            if name.endswith('_test') or name.startswith('Base'):
                continue

            ancestor_names = [
                base_class.__name__ for base_class in inspect.getmro(clazz)]
            # Some classes, such as TranslatableHtmlContentId, are not
            # subclasses of BaseTranslatableObject, despite starting with the
            # string 'Translatable'. So we need to do verification based on the
            # class's ancestors.
            if 'BaseTranslatableObject' in ancestor_names:
                cls._translatable_objects_dict[clazz.__name__] = clazz

    @classmethod
    def get_all_class_names(cls) -> List[TranslatableObjectNames]:
        """Gets a list of all translatable object class names.

        Returns:
            list(str). The full sorted list of translatable object class names.
        """
        cls._refresh_registry()
        return sorted(cls._translatable_objects_dict.keys())

    @overload
    @classmethod
    def get_object_class(
        cls, obj_type: Literal['TranslatableHtml']
    ) -> Type[objects.TranslatableHtml]: ...

    @overload
    @classmethod
    def get_object_class(
        cls, obj_type: Literal['TranslatableUnicodeString']
    ) -> Type[objects.TranslatableUnicodeString]: ...

    @overload
    @classmethod
    def get_object_class(
        cls, obj_type: Literal['TranslatableSetOfUnicodeString']
    ) -> Type[objects.TranslatableSetOfUnicodeString]: ...

    @overload
    @classmethod
    def get_object_class(
        cls, obj_type: Literal['TranslatableSetOfNormalizedString']
    ) -> Type[objects.TranslatableSetOfNormalizedString]: ...

    @classmethod
    def get_object_class(
        cls, obj_type: TranslatableObjectNames
    ) -> TranslatableObjectClasses:
        """Gets a translatable object class by its type.

        Refreshes once if the class is not found; subsequently, throws an
        error.

        Args:
            obj_type: str. The object type to get the class for. Types should
                be in CamelCase.

        Returns:
            BaseTranslatableObject. The subclass of BaseTranslatableObject that
            corresponds to the given class name.

        Raises:
            TypeError. The given obj_type does not correspond to a valid
                translatable object class.
        """
        if obj_type not in cls._translatable_objects_dict:
            cls._refresh_registry()
        if obj_type not in cls._translatable_objects_dict:
            raise TypeError(
                '\'%s\' is not a valid translatable object class.' % obj_type)
        return cls._translatable_objects_dict[obj_type]
