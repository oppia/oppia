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

from __future__ import annotations

import importlib
import itertools
import json
import os

from core import feconf
from core import python_utils
from core.constants import constants


class Registry:
    """Registry of all interactions."""

    # Dict mapping interaction ids to instances of the interactions.
    _interactions = {}
    # Dict mapping State schema version (XX) to interaction specs dict,
    # retrieved from interaction_specs_vXX.json.
    _state_schema_version_to_interaction_specs = {}

    @classmethod
    def get_all_interaction_ids(cls):
        """Get a list of all interaction ids."""
        return list(set(itertools.chain.from_iterable(
            interaction_category['interaction_ids']
            for interaction_category in constants.ALLOWED_INTERACTION_CATEGORIES
        )))

    @classmethod
    def _refresh(cls):
        """Refreshes and updates all the interaction ids to add new interaction
        instances to the registry.
        """
        cls._interactions.clear()

        # Crawl the directories and add new interaction instances to the
        # registry.
        for interaction_id in cls.get_all_interaction_ids():
            module_path_parts = feconf.INTERACTIONS_DIR.split(os.sep)
            module_path_parts.extend([interaction_id, interaction_id])
            module = importlib.import_module('.'.join(module_path_parts))
            clazz = getattr(module, interaction_id)

            ancestor_names = [
                base_class.__name__ for base_class in clazz.__bases__
            ]
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

    @classmethod
    def get_all_specs_for_state_schema_version(cls, state_schema_version):
        """Returns a dict containing the full specs of each interaction for the
        given state schema version, if available.

        Args:
            state_schema_version: int. The state schema version to retrieve
                interaction specs for.

        Returns:
            dict. The interaction specs for the given state schema
            version, in the form of a mapping of interaction id to the
            interaction specs. See interaction_specs.json for an example.

        Raises:
            Exception. No interaction specs json file found for the given state
                schema version.
        """
        if (state_schema_version not in
                cls._state_schema_version_to_interaction_specs):
            file_name = (
                'interaction_specs_state_v%i.json' % state_schema_version)
            spec_file = os.path.join(
                feconf.INTERACTIONS_LEGACY_SPECS_FILE_DIR, file_name)

            try:
                with python_utils.open_file(spec_file, 'r') as f:
                    specs_from_json = json.loads(f.read())
            except IOError:
                raise IOError(
                    'No specs JSON file found for state schema v%i' %
                    state_schema_version)

            cls._state_schema_version_to_interaction_specs[
                state_schema_version] = specs_from_json

        return cls._state_schema_version_to_interaction_specs[
            state_schema_version]

    @classmethod
    def get_all_specs_for_state_schema_version_or_latest(
        cls,
        state_schema_version,
    ):
        """Returns a dict containing the full specs of each interaction for the
        given state schema version, if available else return the latest specs.

        Args:
            state_schema_version: int. The state schema version to retrieve
                interaction specs for.

        Returns:
            dict. The interaction specs for the given state schema
            version, in the form of a mapping of interaction id to the
            interaction specs. See interaction_specs.json for an example.

        Raises:
            Exception. No interaction specs json file found for the given state
                schema version.
        """
        if (state_schema_version not in
                cls._state_schema_version_to_interaction_specs):
            file_name = (
                'interaction_specs_state_v%i.json' % state_schema_version)
            spec_file = os.path.join(
                feconf.INTERACTIONS_LEGACY_SPECS_FILE_DIR, file_name)

            if os.path.isfile(spec_file):
                with python_utils.open_file(spec_file, 'r') as f:
                    specs_from_json = json.loads(f.read())
                cls._state_schema_version_to_interaction_specs[
                    state_schema_version] = specs_from_json
                return cls._state_schema_version_to_interaction_specs[
                    state_schema_version]
            else:
                return cls.get_all_specs()

        return cls._state_schema_version_to_interaction_specs[
            state_schema_version]
