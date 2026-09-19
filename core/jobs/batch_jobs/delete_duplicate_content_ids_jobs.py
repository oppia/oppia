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

from core.domain import (
    exp_domain,
    exp_fetchers,
    state_domain,
    translation_domain,
)
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Any, Dict, List, Set, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services, exp_models

(exp_models,) = models.Registry.import_models([models.Names.EXPLORATION])
datastore_services = models.Registry.import_datastore_services()


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

        fixed_explorations = (
            self.pipeline
            | 'Get all exploration models'
            >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False)
            )
            | 'Transform to exploration domain objects'
            >> beam.Map(exp_fetchers.get_exploration_from_model)
            | 'Check for duplicate content IDs'
            >> beam.Map(self._check_and_fix_duplicate_content_ids)
            | 'Filter fixed explorations'
            >> beam.Filter(lambda result: result is not None)
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_put_results = (
                fixed_explorations
                | 'Extract fixed exploration models'
                >> beam.Map(lambda result: result['fixed_model'])
                | 'Put fixed models' >> ndb_io.PutModels()
            )

        return fixed_explorations | 'Create job run results' >> beam.Map(
            lambda result: job_run_result.JobRunResult.as_stdout(
                f'Fixed exploration {result["exp_id"]} '
                f'(version {result["version"]}) - '
                f'regenerated content IDs: {result["fixed_content_ids"]}'
            )
        )

    @staticmethod
    def _check_and_fix_duplicate_content_ids(
        exploration: exp_domain.Exploration,
    ) -> (
        Dict[str, Union[str, int, List[str], 'exp_models.ExplorationModel']]
        | None
    ):
        """Check and fix duplicate content IDs in an exploration.

        Args:
            exploration: exp_domain.Exploration. The exploration domain object
                to check and fix.

        Returns:
            dict|None. Dict containing fix results if duplicates were found and
            fixed, None otherwise.
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

        if not duplicate_content_ids:
            return None

        content_id_generator = translation_domain.ContentIdGenerator(
            exploration.next_content_id_index
        )

        fixed_content_ids = []

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
                fixed_content_ids.append(
                    f'{duplicate_id} -> {new_content_id} in {state_name}'
                )

        exploration.next_content_id_index = (
            content_id_generator.next_content_id_index
        )

        with datastore_services.get_ndb_context():
            updated_model = exp_models.ExplorationModel.get(exploration.id)
            updated_model.states = exploration.to_dict()['states']
            updated_model.next_content_id_index = (
                exploration.next_content_id_index
            )
            updated_model.version += 1

            return {
                'exp_id': exploration.id,
                'version': exploration.version,
                'fixed_content_ids': fixed_content_ids,
                'fixed_model': updated_model,
            }


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
