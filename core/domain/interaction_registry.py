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

"""Registry for interactions."""
from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import division  # pylint: disable=import-only-modules
from __future__ import print_function  # pylint: disable=import-only-modules

import itertools
import os
import pkgutil
import sys

from constants import constants
import feconf

_PARENT_DIR = os.path.abspath(os.path.join(os.getcwd(), os.pardir))
_FUTURE_PATH = os.path.join(_PARENT_DIR, 'oppia_tools', 'future-0.17.1')

sys.path.insert(0, _FUTURE_PATH)

# pylint: disable=wrong-import-position
# pylint: disable=wrong-import-order
import builtins  # isort:skip
from future import standard_library  # isort:skip

standard_library.install_aliases()
# pylint: enable=wrong-import-order
# pylint: enable=wrong-import-position


class Registry(builtins.object):
    """Registry of all interactions."""

    # Dict mapping interaction ids to instances of the interactions.
    _interactions = {}

    @classmethod
    def get_all_interaction_ids(cls):
        """Get a list of all interaction ids."""
        return list(itertools.chain(*[
            interaction_category['interaction_ids']
            for interaction_category in constants.ALLOWED_INTERACTION_CATEGORIES
        ]))

    @classmethod
    def _refresh(cls):
        """Refreshes and updates all the interaction ids to add new interaction
        instances to the registry.
        """
        cls._interactions.clear()

        all_interaction_ids = cls.get_all_interaction_ids()

        # Assemble all paths to the interactions.
        extension_paths = [
            os.path.join(feconf.INTERACTIONS_DIR, interaction_id)
            for interaction_id in all_interaction_ids]

        # Crawl the directories and add new interaction instances to the
        # registry.
        for loader, name, _ in pkgutil.iter_modules(path=extension_paths):
            module = loader.find_module(name).load_module(name)
            clazz = getattr(module, name)

            ancestor_names = [
                base_class.__name__ for base_class in clazz.__bases__]
            if 'BaseInteraction' in ancestor_names:
                cls._interactions[clazz.__name__] = clazz()

    @classmethod
    def get_all_interactions(cls):
        """Get a list of instances of all interactions."""
        if len(cls._interactions) == 0:
            cls._refresh()
        return list(cls._interactions.values())

    @classmethod
    def get_interaction_by_id(cls, interaction_id):
        """Gets an interaction by its id.

        Refreshes once if the interaction is not found; subsequently, throws a
        KeyError.
        """
        if interaction_id not in cls._interactions:
            cls._refresh()
        return cls._interactions[interaction_id]

    @classmethod
    def get_interaction_html(cls, interaction_ids):
        """Returns the HTML bodies for the given list of interaction ids."""
        return ' \n'.join([
            cls.get_interaction_by_id(interaction_id).html_body
            for interaction_id in interaction_ids])

    @classmethod
    def get_deduplicated_dependency_ids(cls, interaction_ids):
        """Return a list of dependency ids for the given interactions.

        Each entry of the resulting list is unique. The list is sorted in no
        particular order.
        """
        result = set([])
        for interaction_id in interaction_ids:
            interaction = cls.get_interaction_by_id(interaction_id)
            result.update(interaction.dependency_ids)
        return list(result)

    @classmethod
    def get_all_specs(cls):
        """Returns a dict containing the full specs of each interaction."""
        return {
            interaction.id: interaction.to_dict()
            for interaction in cls.get_all_interactions()
        }
