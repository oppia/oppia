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

"""Registry for issues."""

from __future__ import annotations

import importlib
import os

from core import feconf
from core.platform import models
from extensions.issues import base

from typing import Dict, List

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import stats_models

(stats_models,) = models.Registry.import_models([models.Names.STATISTICS])


class Registry:
    """Registry of all issues."""

    # Dict mapping issue types to instances of the issues.
    _issues: Dict[str, base.BaseExplorationIssueSpec] = {}

    @classmethod
    def get_all_issue_types(cls) -> List[str]:
        """Get a list of all issue types.

        Returns:
            list(str). The list of all allowed issue types.
        """
        return stats_models.ALLOWED_ISSUE_TYPES

    @classmethod
    def _refresh(cls) -> None:
        """Initializes the mapping between issue types to instances of the issue
        classes.
        """
        cls._issues.clear()

        for issue_type in cls.get_all_issue_types():
            module_path_parts = feconf.ISSUES_DIR.split(os.sep)
            module_path_parts.extend([issue_type, issue_type])
            module = importlib.import_module('.'.join(module_path_parts))
            clazz = getattr(module, issue_type)

            ancestor_names = [
                base_class.__name__ for base_class in clazz.__bases__
            ]
            if 'BaseExplorationIssueSpec' in ancestor_names:
                cls._issues[clazz.__name__] = clazz()

    @classmethod
    def get_all_issues(cls) -> List[base.BaseExplorationIssueSpec]:
        """Get a list of instances of all issues.

        Returns:
            list(*). A list of all issue class instances. Classes all have
            "BaseExplorationIssueSpec" as an ancestor class.
        """
        if len(cls._issues) == 0:
            cls._refresh()
        return list(cls._issues.values())

    @classmethod
    def get_issue_by_type(
        cls, issue_type: str
    ) -> base.BaseExplorationIssueSpec:
        """Gets an issue by its type.

        Refreshes once if the issue is not found; subsequently, throws a
        KeyError.

        Args:
            issue_type: str. Type of the issue.

        Returns:
            *. An instance of the corresponding issue class. This class has
            "BaseExplorationIssueSpec" as an ancestor class.
        """
        if issue_type not in cls._issues:
            cls._refresh()
        return cls._issues[issue_type]
