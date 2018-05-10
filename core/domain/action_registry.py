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

import os
import pkgutil

import feconf


class Registry(object):
    """Registry of all actions."""

    # Dict mapping action IDs to instances of the actions.
    _actions = {}

    @classmethod
    def get_all_action_ids(cls):
        """Get a list of all action IDs.

        Returns:
            list(str). The list of all allowed action IDs.
        """
        return feconf.ALLOWED_ACTION_IDS

    @classmethod
    def set_actions(cls, actions):
        """Sets the mapping between action IDs to instances of the action
        classes to the provided value.

        Args:
            actions: dict. Mapping action IDs to instances of the actions.
        """
        cls._actions = actions

    @classmethod
    def _refresh(cls):
        """Initializes the mapping between action IDs to instances of the action
        classes.
        """
        cls._actions.clear()

        all_action_ids = cls.get_all_action_ids()

        # Assemble all paths to the actions.
        extension_paths = [
            os.path.join(feconf.ACTIONS_DIR, action_id)
            for action_id in all_action_ids]

        # Crawl the directories and add new action instances to the
        # registry.
        for loader, name, _ in pkgutil.iter_modules(path=extension_paths):
            module = loader.find_module(name).load_module(name)
            clazz = getattr(module, name)

            ancestor_names = [
                base_class.__name__ for base_class in clazz.__bases__]
            if 'BaseLearnerActionSpec' in ancestor_names:
                cls._actions[clazz.__name__] = clazz()

    @classmethod
    def get_all_actions(cls):
        """Get a list of instances of all actions.

        Returns:
            list. A list of all action class instances.
        """
        if len(cls._actions) == 0:
            cls._refresh()
        return cls._actions.values()

    @classmethod
    def get_action_by_id(cls, action_id):
        """Gets an action by its ID.

        Refreshes once if the action is not found; subsequently, throws a
        KeyError.

        Args:
            action_id: str. ID of the action.

        Returns:
            An instance of the corresponding action class.
        """
        if action_id not in cls._actions:
            cls._refresh()
        return cls._actions[action_id]
