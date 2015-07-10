# coding: utf-8
#
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

"""Registry for triggers."""

import inspect

from extensions.triggers import trigger_classes


class Registry(object):
    """Registry of all triggers."""

    # Dict mapping trigger ids to instances of the triggers.
    _triggers_dict = {}

    @classmethod
    def _refresh(cls):
        cls._triggers_dict.clear()

        for name, clazz in inspect.getmembers(
                trigger_classes, inspect.isclass):
            if name.endswith('_test') or name == 'BaseTrigger':
                continue

            ancestor_names = [
                base_class.__name__ for base_class in inspect.getmro(clazz)]
            if 'BaseTrigger' not in ancestor_names:
                continue

            cls._triggers_dict[clazz.get_trigger_type()] = clazz()

    @classmethod
    def get_trigger(cls, trigger_type):
        """Gets a trigger by its type.

        Refreshes once if the trigger is not found; subsequently, throws a
        KeyError.
        """
        if trigger_type not in cls._triggers_dict:
            cls._refresh()

        return cls._triggers_dict[trigger_type]
