# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Registry of all interaction answer view calculations."""

__author__ = 'Marcel Schmittfull'

import copy
import inspect


class Registry(object):
    """Registry of all calculations."""

    # Dict mapping calculation names to calculation classes.
    calculations_dict = {}

    @classmethod
    def _refresh_registry(cls):
        cls.calculations_dict.clear()

        # Add new calculation instances to the registry.
        for name, clazz in inspect.getmembers(calculations, inspect.isclass):
            if name.endswith('_test') or name == 'BaseCalculation':
                continue

            ancestor_names = [
                base_class.__name__ for base_class in inspect.getmro(clazz)]
            if 'BaseCalculation' not in ancestor_names:
                continue

            cls.calculations_dict[clazz.__name__] = clazz

    @classmethod
    def get_all_calculation_classes(cls):
        """Get the dict of all calculation classes."""
        cls._refresh_registry()
        return copy.deepcopy(cls.calculations_dict)

    @classmethod
    def get_calculation_class_by_name(cls, calc_name):
        """Gets a calculation class by its name.
        
        Refreshes once if the class is not found; subsequently, throws an
        error."""
        if calc_name not in cls.calculations_dict:
            cls._refresh_registry()
        if calc_name not in cls.calculations_dict:
            raise TypeError('\'%s\' is not a valid calculation name.' % calc_name)
        return cls.calculations_dict[calc_name]

