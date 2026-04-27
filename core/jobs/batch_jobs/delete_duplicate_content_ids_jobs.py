# coding: utf-8
#
# Copyright 2025 The Oppia Authors. All Rights Reserved.
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

"""Jobs for identifying and fixing duplicate content IDs in explorations."""

from __future__ import annotations

import copy

from core.domain import (
    exp_domain,
    exp_fetchers,
    state_domain,
    translation_domain,
    voiceover_domain,
    voiceover_services,
)
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models
from core.storage.base_model import gae_models as base_models

import apache_beam as beam
from typing import Any, Dict, List, Set, Tuple, Union, cast

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models, voiceover_models

(exp_models, voiceover_models) = models.Registry.import_models(
    [models.Names.EXPLORATION, models.Names.VOICEOVER]
)


class IdentifyExplorationsWithDuplicateContentIdsJob(base_jobs.JobBase):
    """Job that identifies explorations with duplicate content IDs."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Identifies explorations with duplicate content IDs.

        Returns:
            PCollection. A PCollection of 'SUCCESS' or 'FAILURE' results from
            identifying explorations with duplicate content IDs.
        """

        explorations_with_duplicates = (
            self.pipeline
            | 'Get all exploration models'
            >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False)
            )
            | 'Transform to exploration domain objects'
            >> beam.Map(exp_fetchers.get_exploration_from_model)
            | 'Check for duplicate content IDs'
            >> beam.Map(self._check_for_duplicate_content_ids)
            | 'Filter explorations with duplicates'
            >> beam.Filter(lambda result: result is not None)
        )

        return (
            explorations_with_duplicates
            | 'Create job run results'
            >> beam.Map(
                lambda result: job_run_result.JobRunResult.as_stdout(
                    f'Exploration {result["exp_id"]} '
                    f'(version {result["version"]}) '
                    f'has duplicate content IDs: {result["duplicates"]}'
                )
            )
        )

    @staticmethod
    def _check_for_duplicate_content_ids(
        exploration: exp_domain.Exploration,
    ) -> Dict[str, Union[str, int, Dict[str, List[str]]]] | None:
        """Check if an exploration has duplicate content IDs.

        Args:
            exploration: exp_domain.Exploration. The exploration domain object
                to check.

        Returns:
            dict|None. Dict containing exploration info and duplicates if found,
            None otherwise.
        """
        all_content_ids: List[str] = []
        state_to_content_ids: Dict[str, List[str]] = {}

        for state_name, state in exploration.states.items():
            state_content_ids = state.get_translatable_content_ids()
            all_content_ids.extend(state_content_ids)
            state_to_content_ids[state_name] = state_content_ids

        seen_content_ids: Set[str] = set()
        duplicate_content_ids: Set[str] = set()

        for content_id in all_content_ids:
            if content_id in seen_content_ids:
                duplicate_content_ids.add(content_id)
            else:
                seen_content_ids.add(content_id)

        if duplicate_content_ids:
            duplicate_details = {}
            for duplicate_id in duplicate_content_ids:
                states_with_duplicate = [
                    state_name
                    for state_name, content_ids in state_to_content_ids.items()
                    if duplicate_id in content_ids
                ]
                duplicate_details[duplicate_id] = states_with_duplicate

            return {
                'exp_id': exploration.id,
                'version': exploration.version,
                'duplicates': duplicate_details,
            }

        return None


class FixExplorationsWithDuplicateContentIdsJob(base_jobs.JobBase):
    """Job that fixes explorations with duplicate content IDs."""

    DATASTORE_UPDATES_ALLOWED = True

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Fixes explorations with duplicate content IDs.

        Returns:
            PCollection. A PCollection of 'SUCCESS' or 'FAILURE' results from
            fixing explorations with duplicate content IDs.
        """

        exploration_model_pcoll = (
            self.pipeline
            | 'Get all exploration models'
            >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False)
            )
        )

        entity_voiceovers_model_pcoll = (
            self.pipeline
            | 'Get all entity voiceover models'
            >> ndb_io.GetModels(
                voiceover_models.EntityVoiceoversModel.get_all()
            )
        )

        exp_id_to_exploration_model = (
            exploration_model_pcoll
            | 'Key exploration model by ID'
            >> beam.Map(lambda model: (model.id, model))
        )

        exp_id_to_voiceover_models = (
            entity_voiceovers_model_pcoll
            | 'Key voiceover model by entity ID'
            >> beam.Map(lambda model: (model.entity_id, model))
        )

        combined_models = {
            'exploration': exp_id_to_exploration_model,
            'voiceovers': exp_id_to_voiceover_models,
        } | 'Join explorations with voiceover models' >> beam.CoGroupByKey()

        fixed_explorations = (
            combined_models
            | 'Check for duplicate content IDs'
            >> beam.Map(self._check_and_fix_duplicate_content_ids)
            | 'Filter fixed explorations'
            >> beam.Filter(lambda result: result is not None)
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_put_results = (
                fixed_explorations
                | 'Extract fixed exploration and voiceover models'
                >> beam.FlatMap(
                    lambda result: [
                        result['fixed_model'],
                        *result['fixed_voiceover_models'],
                    ]
                )
                | 'Put fixed models' >> ndb_io.PutModels()
            )

        return fixed_explorations | 'Create job run results' >> beam.Map(
            lambda result: job_run_result.JobRunResult.as_stdout(
                f'Fixed exploration {result["exp_id"]} '
                f'(version {result["version"]}) - '
                f'regenerated content IDs: {result["fixed_content_ids"]}'
            )
        )

    # Here we use type Any because CoGroupByKey produces a dictionary with
    # string keys mapping to sequences of different model types (exploration
    # and voiceovers), and the exact element types vary by key, requiring a
    # flexible type that can represent both lists of exploration models and
    # lists of voiceover models simultaneously.
    @staticmethod
    def _check_and_fix_duplicate_content_ids(
        combined_models: Tuple[str, Dict[str, Any]],
    ) -> (
        Dict[
            str,
            Union[
                str,
                int,
                List[str],
                base_models.BaseModel,
                List[base_models.BaseModel],
            ],
        ]
        | None
    ):
        """Check and fix duplicate content IDs in an exploration.

        Args:
            combined_models: tuple(str, dict). A tuple where the first element
                is the exploration ID and the second element is a dictionary
                with keys 'exploration' and 'voiceovers' mapping to lists of
                corresponding models.

        Returns:
            dict|None. Dict containing fix results if duplicates were found and
            fixed, None otherwise.
        """
        exploration_model_list = list(combined_models[1]['exploration'])
        voiceover_model_list = combined_models[1]['voiceovers']

        if not exploration_model_list:
            return None

        # Here we use cast because CoGroupByKey produces sequences of Any,
        # but 'exploration' values are always ExplorationModel instances.
        exploration_model = cast(
            exp_models.ExplorationModel, exploration_model_list[0]
        )
        exploration = exp_fetchers.get_exploration_from_model(exploration_model)

        all_content_ids: List[str] = []
        state_to_content_ids: Dict[str, List[str]] = {}

        for state_name, state in exploration.states.items():
            state_content_ids = state.get_translatable_content_ids()
            all_content_ids.extend(state_content_ids)
            state_to_content_ids[state_name] = state_content_ids

        seen_content_ids: Set[str] = set()
        duplicate_content_ids: Set[str] = set()

        for content_id in all_content_ids:
            if content_id in seen_content_ids:
                duplicate_content_ids.add(content_id)
            else:
                seen_content_ids.add(content_id)

        if not duplicate_content_ids:
            return None

        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )

        fixed_content_ids = []
        # Now maps old_content_id -> list of (new_content_id, state_name)
        content_id_replacements: Dict[str, List[Tuple[str, str]]] = {}

        for duplicate_id in duplicate_content_ids:
            states_with_duplicate = [
                state_name
                for state_name, content_ids in state_to_content_ids.items()
                if duplicate_id in content_ids
            ]

            # Keep the first occurrence, regenerate others.
            for state_name in states_with_duplicate[1:]:
                state = exploration.states[state_name]

                new_content_id = content_id_generator.generate(
                    translation_domain.ContentType.CONTENT
                )

                _replace_content_id_in_state(
                    state, duplicate_id, new_content_id
                )
                if duplicate_id not in content_id_replacements:
                    content_id_replacements[duplicate_id] = []
                content_id_replacements[duplicate_id].append(
                    (new_content_id, state_name)
                )
                fixed_content_ids.append(
                    f'{duplicate_id} -> {new_content_id} in {state_name}'
                )

        exploration.next_content_id_index = (
            content_id_generator.next_content_id_index
        )

        # Here we use cast because CoGroupByKey produces sequences of Any,
        # but 'voiceovers' values are always EntityVoiceoversModel instances.
        all_voiceover_models = cast(
            List[voiceover_models.EntityVoiceoversModel],
            list(voiceover_model_list),
        )
        current_voiceover_models = [
            vm
            for vm in all_voiceover_models
            if vm.entity_version == exploration.version
        ]

        updated_voiceover_models = _create_updated_entity_voiceovers_models(
            current_voiceover_models,
            exploration.version + 1,
            content_id_replacements,
        )

        exploration_model.states = exploration.to_dict()['states']
        exploration_model.next_content_id_index = (
            exploration.next_content_id_index
        )
        exploration_model.version += 1

        return {
            'exp_id': exploration.id,
            'version': exploration.version,
            'fixed_content_ids': fixed_content_ids,
            'fixed_model': exploration_model,
            'fixed_voiceover_models': updated_voiceover_models,
        }


def _create_updated_entity_voiceovers_models(
    entity_voiceover_models: List[voiceover_models.EntityVoiceoversModel],
    new_version: int,
    content_id_replacements: Dict[str, List[Tuple[str, str]]],
) -> List[base_models.BaseModel]:
    """Create updated voiceover models for a migrated exploration version.

    Args:
        entity_voiceover_models: list(EntityVoiceoversModel). The existing
            voiceover models for the exploration's current version.
        new_version: int. The new exploration version after the fix.
        content_id_replacements: dict(str, list(str)). Mapping from each old
            duplicate content ID to the list of newly generated content IDs
            that replaced it in the states where it was a duplicate.

    Returns:
        list(EntityVoiceoversModel). The voiceover models for the new
        exploration version.
    """
    updated_voiceover_models: List[base_models.BaseModel] = []

    for voiceover_model in entity_voiceover_models:
        entity_voiceovers = voiceover_services.get_entity_voiceovers_from_model(
            voiceover_model
        )
        new_voiceovers_mapping = copy.deepcopy(
            entity_voiceovers.voiceovers_mapping
        )
        new_audio_offsets = copy.deepcopy(
            entity_voiceovers.automated_voiceovers_audio_offsets_msecs
        )

        for (
            old_content_id,
            new_content_id_state_pairs,
        ) in content_id_replacements.items():
            if old_content_id in entity_voiceovers.voiceovers_mapping:
                for new_content_id, _ in new_content_id_state_pairs:
                    new_voiceovers_mapping[new_content_id] = copy.deepcopy(
                        entity_voiceovers.voiceovers_mapping[old_content_id]
                    )

            if (
                old_content_id
                in entity_voiceovers.automated_voiceovers_audio_offsets_msecs
            ):
                for new_content_id, _ in new_content_id_state_pairs:
                    new_audio_offsets[new_content_id] = copy.deepcopy(
                        entity_voiceovers.automated_voiceovers_audio_offsets_msecs[
                            old_content_id
                        ]
                    )

        updated_entity_voiceovers = voiceover_domain.EntityVoiceovers(
            entity_id=entity_voiceovers.entity_id,
            entity_type=entity_voiceovers.entity_type,
            entity_version=new_version,
            language_accent_code=entity_voiceovers.language_accent_code,
            voiceovers_mapping=new_voiceovers_mapping,
            automated_voiceovers_audio_offsets_msecs=new_audio_offsets,
        )
        updated_entity_voiceovers.validate()
        updated_voiceover_models.append(
            voiceover_services.create_entity_voiceovers_model(
                updated_entity_voiceovers
            )
        )

    return updated_voiceover_models


def _replace_content_id_in_state(
    state: state_domain.State, old_content_id: str, new_content_id: str
) -> None:
    """Replace a content ID in a state with a new one.
    This is a helper function that updates content IDs throughout a state
    object.

    Args:
        state: State. The state object to update.
        old_content_id: str. The old content ID to replace.
        new_content_id: str. The new content ID to use.
    """
    if (
        hasattr(state.content, 'content_id')
        and state.content.content_id == old_content_id
    ):
        state.content.content_id = new_content_id

    if state.interaction:
        for ca_value in state.interaction.customization_args.values():
            # Get all content IDs from this customization arg.
            content_ids = ca_value.get_content_ids()
            if old_content_id in content_ids:
                # Replace the content ID in the value.
                _replace_content_id_in_value(
                    ca_value.value, old_content_id, new_content_id
                )

        for answer_group in state.interaction.answer_groups:
            if hasattr(answer_group.outcome, 'feedback') and hasattr(
                answer_group.outcome.feedback, 'content_id'
            ):
                if answer_group.outcome.feedback.content_id == old_content_id:
                    answer_group.outcome.feedback.content_id = new_content_id

        if (
            state.interaction.default_outcome
            and hasattr(state.interaction.default_outcome, 'feedback')
            and hasattr(
                state.interaction.default_outcome.feedback, 'content_id'
            )
        ):
            if (
                state.interaction.default_outcome.feedback.content_id
                == old_content_id
            ):
                state.interaction.default_outcome.feedback.content_id = (
                    new_content_id
                )

        for hint in state.interaction.hints:
            if hasattr(hint, 'hint_content') and hasattr(
                hint.hint_content, 'content_id'
            ):
                if hint.hint_content.content_id == old_content_id:
                    hint.hint_content.content_id = new_content_id

        if (
            state.interaction.solution
            and hasattr(state.interaction.solution, 'explanation')
            and hasattr(state.interaction.solution.explanation, 'content_id')
        ):
            if (
                state.interaction.solution.explanation.content_id
                == old_content_id
            ):
                state.interaction.solution.explanation.content_id = (
                    new_content_id
                )


# Here we use type Any because the customization arg value can be of
# various types including lists, dicts, or objects with content_id
# attributes, and we need to handle all these cases recursively.
def _replace_content_id_in_value(
    value: Any, old_content_id: str, new_content_id: str
) -> None:
    """Replace a content ID in a customization arg value.

    Args:
        value: Any. The value to search and replace in.
        old_content_id: str. The old content ID to replace.
        new_content_id: str. The new content ID to use.
    """
    if hasattr(value, 'content_id') and value.content_id == old_content_id:
        value.content_id = new_content_id
    elif isinstance(value, list):
        for item in value:
            _replace_content_id_in_value(item, old_content_id, new_content_id)
    elif isinstance(value, dict):
        for item_value in value.values():
            _replace_content_id_in_value(
                item_value, old_content_id, new_content_id
            )


class AuditFixExplorationsWithDuplicateContentIdsJob(
    FixExplorationsWithDuplicateContentIdsJob
):
    """Audit job for FixExplorationsWithDuplicateContentIdsJob."""

    DATASTORE_UPDATES_ALLOWED = False
