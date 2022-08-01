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

"""Registry for visualizations."""

from __future__ import annotations

import inspect

from extensions.visualizations import models

from typing import Dict, List, Type


class Registry:
    """Registry of all visualizations."""

    # Dict mapping visualization class names to their classes.
    visualizations_dict: Dict[str, Type[models.BaseVisualization]] = {}

    @classmethod
    def _refresh_registry(cls) -> None:
        """Clears and adds new visualization instances to the registry."""
        cls.visualizations_dict.clear()

        # Add new visualization instances to the registry.
        for name, clazz in inspect.getmembers(
                models, predicate=inspect.isclass):
            if name.endswith('_test') or name == 'BaseVisualization':
                continue

            ancestor_names = [
                base_class.__name__ for base_class in inspect.getmro(clazz)]
            if 'BaseVisualization' in ancestor_names:
                cls.visualizations_dict[clazz.__name__] = clazz

    @classmethod
    def get_visualization_class(
        cls, visualization_id: str
    ) -> Type[models.BaseVisualization]:
        """Gets a visualization class by its id (which is also its class name).

        The registry will refresh if the desired class is not found. If it's
        still not found after the refresh, this method will throw an error.
        """
        if visualization_id not in cls.visualizations_dict:
            cls._refresh_registry()
        if visualization_id not in cls.visualizations_dict:
            raise TypeError(
                '\'%s\' is not a valid visualization id.' % visualization_id)
        return cls.visualizations_dict[visualization_id]

    @classmethod
    def get_all_visualization_ids(cls) -> List[str]:
        """Gets a visualization class by its id
        (which is also its class name).
        """
        if not cls.visualizations_dict:
            cls._refresh_registry()
        return list(cls.visualizations_dict.keys())
