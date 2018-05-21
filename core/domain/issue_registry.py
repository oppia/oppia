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

import os
import pkgutil

from core.platform import models
import feconf

(stats_models,) = models.Registry.import_models([models.NAMES.statistics])


class Registry(object):
    """Registry of all issues."""

    # Dict mapping issue types to instances of the issues.
    _issues = {}

    @classmethod
    def get_all_issue_types(cls):
        """Get a list of all issue types.

        Returns:
            list(str). The list of all allowed issue types.
        """
        return stats_models.ALLOWED_ISSUE_TYPES

    @classmethod
    def set_issues(cls, issues):
        """Sets the mapping between issue types to instances of the issue
        classes to the provided value.

        Args:
            issues: dict. Mapping issue types to instances of the issues.
        """
        cls._issues = issues

    @classmethod
    def _refresh(cls):
        """Initializes the mapping between issue types to instances of the issue
        classes.
        """
        cls._issues.clear()

        all_issue_types = cls.get_all_issue_types()

        # Assemble all paths to the issues.
        extension_paths = [
            os.path.join(feconf.ISSUES_DIR, issue_type)
            for issue_type in all_issue_types]

        # Crawl the directories and add new issue instances to the
        # registry.
        for loader, name, _ in pkgutil.iter_modules(path=extension_paths):
            module = loader.find_module(name).load_module(name)
            clazz = getattr(module, name)

            ancestor_names = [
                base_class.__name__ for base_class in clazz.__bases__]
            if 'BaseExplorationIssueSpec' in ancestor_names:
                cls._issues[clazz.__name__] = clazz()

    @classmethod
    def get_all_issues(cls):
        """Get a list of instances of all issues.

        Returns:
            list. A list of all issue class instances.
        """
        if len(cls._issues) == 0:
            cls._refresh()
        return cls._issues.values()

    @classmethod
    def get_issue_by_type(cls, issue_type):
        """Gets an issue by its type.

        Refreshes once if the issue is not found; subsequently, throws a
        KeyError.

        Args:
            issue_type: str. Type of the issue.

        Returns:
            An instance of the corresponding issue class.
        """
        if issue_type not in cls._issues:
            cls._refresh()
        return cls._issues[issue_type]
