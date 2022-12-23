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

from core import constants
from core import feconf

from typing import Dict, List, Optional

MYPY = False
if MYPY: # pragma: no cover
    from extensions.interactions import base


class Registry:
    """Registry of all interactions."""

    # Dict mapping interaction ids to instances of the interactions.
    _interactions: Dict[str, base.BaseInteraction] = {}
    # Dict mapping State schema version (XX) to interaction specs dict,
    # retrieved from interaction_specs_vXX.json.
    _state_schema_version_to_interaction_specs: (
        Dict[int, Dict[str, base.BaseInteractionDict]]
    ) = {}

    @classmethod
    def get_all_interaction_ids(cls) -> List[str]:
        """Get a list of all interaction ids."""
        return list(set(itertools.chain.from_iterable(
            interaction_category['interaction_ids']
            for interaction_category
            in constants.constants.ALLOWED_INTERACTION_CATEGORIES
        )))

    @classmethod
    def _refresh(cls) -> None:
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
    def get_all_interactions(cls) -> List[base.BaseInteraction]:
        """Get a list of instances of all interactions."""
        if len(cls._interactions) == 0:
            cls._refresh()
        return list(cls._interactions.values())

    @classmethod
    def get_interaction_by_id(
        cls, interaction_id: Optional[str]
    ) -> base.BaseInteraction:
        """Gets an interaction by its id.

        Refreshes once if the interaction is not found; subsequently, throws a
        KeyError.

        Args:
            interaction_id: Optional[str]. The interaction id.

        Returns:
            BaseInteraction. An interaction for the given interaction_id.

        Raises:
            Exception. No interaction exists for the None interaction_id.
        """
        if interaction_id is None:
            raise Exception(
                'No interaction exists for the None interaction_id.'
            )
        if interaction_id not in cls._interactions:
            cls._refresh()
        return cls._interactions[interaction_id]

    @classmethod
    def get_deduplicated_dependency_ids(
        cls, interaction_ids: List[str]
    ) -> List[str]:
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
    def get_all_specs(cls) -> Dict[str, base.BaseInteractionDict]:
        """Returns a dict containing the full specs of each interaction."""
        return {
            interaction.id: interaction.to_dict()
            for interaction in cls.get_all_interactions()
        }

    @classmethod
    def get_all_specs_for_state_schema_version(
        cls,
        state_schema_version: int,
        can_fetch_latest_specs: bool = False
    ) -> Dict[str, base.BaseInteractionDict]:
        """Returns a dict containing the full specs of each interaction for the
        given state schema version, if available else return all specs or an
        error depending on can_fetch_latest_specs.

        Args:
            state_schema_version: int. The state schema version to retrieve
                interaction specs for.
            can_fetch_latest_specs: boolean. Whether to fetch the latest specs
                if the legacy specs file is not found.

        Returns:
            dict. The interaction specs for the given state schema
            version, in the form of a mapping of interaction id to the
            interaction specs. See interaction_specs.json for an example.

        Raises:
            OSError. No interaction specs json file found for the given state
                schema version.
        """
        if (state_schema_version not in
                cls._state_schema_version_to_interaction_specs):
            spec_file_path = os.path.join(
                'interactions',
                'legacy_interaction_specs_by_state_version',
                'interaction_specs_state_v%i.json' % state_schema_version
            )
            spec_file_contents: Optional[str]
            try:
                spec_file_contents = constants.get_package_file_contents(
                    'extensions', spec_file_path
                )
            except FileNotFoundError:
                spec_file_contents = None

            if spec_file_contents:
                specs_from_json: Dict[str, base.BaseInteractionDict] = (
                    json.loads(spec_file_contents)
                )
                cls._state_schema_version_to_interaction_specs[
                    state_schema_version] = specs_from_json
                return cls._state_schema_version_to_interaction_specs[
                    state_schema_version]
            elif can_fetch_latest_specs:
                return cls.get_all_specs()
            else:
                raise IOError(
                    'No specs JSON file found for state schema v%i' %
                    state_schema_version)

        return cls._state_schema_version_to_interaction_specs[
            state_schema_version]
