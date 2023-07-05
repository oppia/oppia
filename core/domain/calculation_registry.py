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

"""Registry for calculations."""

from __future__ import annotations

import inspect

from extensions.answer_summarizers import models

from typing import Callable, Dict, Literal, overload


class Registry:
    """Registry of all calculations for summarizing answers."""

    # Dict mapping calculation class names to their classes.
    _calculations_dict: Dict[str, Callable[..., models.BaseCalculation]] = {}

    @classmethod
    def _refresh_registry(cls) -> None:
        """Refreshes the registry to add new visualization instances."""
        cls._calculations_dict.clear()

        # Add new visualization instances to the registry.
        for name, clazz in inspect.getmembers(
                models, predicate=inspect.isclass):
            if name.endswith('_test') or name == 'BaseCalculation':
                continue

            ancestor_names = [
                base_class.__name__ for base_class in inspect.getmro(clazz)]
            if 'BaseCalculation' in ancestor_names:
                cls._calculations_dict[clazz.__name__] = clazz

    @overload
    @classmethod
    def get_calculation_by_id(
        cls, calculation_id: Literal['AnswerFrequencies']
    ) -> models.AnswerFrequencies: ...

    @overload
    @classmethod
    def get_calculation_by_id(
        cls, calculation_id: Literal['Top5AnswerFrequencies']
    ) -> models.Top5AnswerFrequencies: ...

    @overload
    @classmethod
    def get_calculation_by_id(
        cls, calculation_id: Literal['Top10AnswerFrequencies']
    ) -> models.Top10AnswerFrequencies: ...

    @overload
    @classmethod
    def get_calculation_by_id(
        cls, calculation_id: Literal['FrequencyCommonlySubmittedElements']
    ) -> models.FrequencyCommonlySubmittedElements: ...

    @overload
    @classmethod
    def get_calculation_by_id(
        cls, calculation_id: Literal['TopAnswersByCategorization']
    ) -> models.TopAnswersByCategorization: ...

    @overload
    @classmethod
    def get_calculation_by_id(
        cls, calculation_id: Literal['TopNUnresolvedAnswersByFrequency']
    ) -> models.TopNUnresolvedAnswersByFrequency: ...

    @overload
    @classmethod
    def get_calculation_by_id(
        cls, calculation_id: str
    ) -> models.BaseCalculation: ...

    @classmethod
    def get_calculation_by_id(
        cls, calculation_id: str
    ) -> models.BaseCalculation:
        """Gets a calculation instance by its id (which is also its class name).

        Refreshes once if the class is not found; subsequently, throws an
        error.
        """
        if calculation_id not in cls._calculations_dict:
            cls._refresh_registry()
        if calculation_id not in cls._calculations_dict:
            raise TypeError(
                '\'%s\' is not a valid calculation id.' % calculation_id)
        return cls._calculations_dict[calculation_id]()
