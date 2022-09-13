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

"""Registry for actions."""

from __future__ import annotations

import importlib
import os

from core import feconf
from core.platform import models
from extensions.actions import base

from typing import Dict, List

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import stats_models

(stats_models,) = models.Registry.import_models([models.Names.STATISTICS])


class Registry:
    """Registry of all actions."""

    # Dict mapping action IDs to instances of the actions.
    _actions: Dict[str, base.BaseLearnerActionSpec] = {}

    @classmethod
    def get_all_action_types(cls) -> List[str]:
        """Get a list of all action types.

        Returns:
            list(str). The list of all allowed action types.
        """
        return stats_models.ALLOWED_ACTION_TYPES

    @classmethod
    def _refresh(cls) -> None:
        """Initializes the mapping between action types to instances of the
        action classes.
        """
        cls._actions.clear()

        for action_type in cls.get_all_action_types():
            module_path_parts = feconf.ACTIONS_DIR.split(os.sep)
            module_path_parts.extend([action_type, action_type])
            module = importlib.import_module('.'.join(module_path_parts))
            clazz = getattr(module, action_type)

            ancestor_names = [
                base_class.__name__ for base_class in clazz.__bases__]
            if 'BaseLearnerActionSpec' in ancestor_names:
                cls._actions[clazz.__name__] = clazz()

    @classmethod
    def get_all_actions(cls) -> List[base.BaseLearnerActionSpec]:
        """Get a list of instances of all actions.

        Returns:
            list(*). A list of all action class instances. Classes all have
            "BaseLearnerActionSpec" as an ancestor class.
        """
        if len(cls._actions) == 0:
            cls._refresh()
        return list(cls._actions.values())

    @classmethod
    def get_action_by_type(cls, action_type: str) -> base.BaseLearnerActionSpec:
        """Gets an action by its type.

        Refreshes once if the action is not found; subsequently, throws a
        KeyError.

        Args:
            action_type: str. Type of the action.

        Returns:
            *. An instance of the corresponding action class. This class has
            "BaseLearnerActionSpec" as an ancestor class.
        """
        if action_type not in cls._actions:
            cls._refresh()
        return cls._actions[action_type]
