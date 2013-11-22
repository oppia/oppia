# Copyright 2013 Google Inc. All Rights Reserved.
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

"""Service methods for typed instances."""

__author__ = 'Sean Lip'

import copy
import inspect
import os
import pkgutil

from extensions.objects.models import objects
import feconf


def get_object_class(cls_name):
    """Gets the object class based on the class name."""
    # TODO(sll):
    # 1. Replace the following with the function below it once the registry
    #    fully works.
    # 2. Make callers call Registry.get_object_class_by_type() and then
    #    delete this function.
    try:
        assert cls_name != 'BaseObject'

        object_class = getattr(objects, cls_name)
        assert object_class
    except Exception:
        raise TypeError('\'%s\' is not a valid typed object class.' % cls_name)

    return object_class

    """
    object_class = Registry.get_object_class_by_type(cls_name)

    if object_class is None:
        raise TypeError('\'%s\' is not a valid typed object class.' % cls_name)

    return object_class
    """


# TODO(sll): Remove this.
RECOGNIZED_OBJECTS = ['UnicodeString', 'Real', 'Int', 'Html', 'Filepath']


class Registry(object):
    """Registry of all objects."""

    # Dict mapping object class names to their classes.
    objects_dict = {}

    @classmethod
    def _refresh_registry(cls):
        cls.objects_dict.clear()

        # Add new object instances to the registry.
        for name, clazz in inspect.getmembers(objects, inspect.isclass):
            if name.endswith('_test') or name == 'BaseObject':
                continue
            
            # TODO(sll): Remove this.
            if name not in RECOGNIZED_OBJECTS:
                continue

            cls.objects_dict[clazz.__name__] = clazz

    @classmethod
    def get_all_object_classes(cls):
        """Get the dict of all object classes."""
        cls._refresh_registry()
        return copy.deepcopy(cls.objects_dict)

    @classmethod
    def get_object_class_by_type(cls, obj_type):
        """Gets an object class by its type. Types are CamelCased.

        Refreshes once if the class is not found; subsequently, throws an
        error."""
        if obj_type not in cls.objects_dict:
            cls._refresh_registry()
        return cls.objects_dict[obj_type]
