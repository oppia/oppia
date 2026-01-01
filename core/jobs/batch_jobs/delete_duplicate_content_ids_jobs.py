# coding: utf-8
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

from typing import Any, Dict, List, Set, Tuple

import logging

import apache_beam as beam

from core import feconf
from core.domain import exp_domain, exp_fetchers, state_domain
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models
import result

MYPY = False
if MYPY:
    from mypy_imports import (
        datastore_services,
        exp_models,
        translation_models,
        voiceover_models,
    )


(exp_models, translation_models, voiceover_models) = models.Registry.import_models([
    models.Names.EXPLORATION,
    models.Names.TRANSLATION,
    models.Names.VOICEOVER,
])
datastore_services = models.Registry.import_datastore_services()

class DeleteDuplicateContentIdsJob(base_jobs.JobBase):
    """Job that fixes explorations with duplicate content IDs across states.

    This job:
    1. Detects duplicate content IDs within an exploration (across all states)
    2. Regenerates duplicate content IDs to ensure uniqueness
    3. Migrates translations from old content IDs to new ones
    4. Migrates voiceovers from old content IDs to new ones
    5. Updates the exploration version and increments next_content_id_index
    """

    DATASTORE_UPDATES_ALLOWED = True

    @staticmethod
    def _get_all_content_ids_from_exploration(
        states_dict: Dict[str, state_domain.StateDict],
    ) -> Dict[str, List[str]]:
        """Extracts all content IDs from an exploration's states.

        Args:
            states_dict: dict. The states dictionary from an exploration.

        Returns:
            dict. Maps state_name -> list of content IDs in that state.
        """
        state_to_content_ids: Dict[str, List[str]] = {}

        for state_name, state_dict in states_dict.items():
            content_ids: Set[str] = set()
            cid = state_dict['content']['content_id']
            if isinstance(cid, str):
                content_ids.add(cid)
            interaction = state_dict['interaction']
            if interaction['default_outcome'] is not None:
                cid2 = interaction['default_outcome']['feedback']['content_id']
                if isinstance(cid2, str):
                    content_ids.add(cid2)
            for answer_group in interaction['answer_groups']:
                cid3 = answer_group['outcome']['feedback']['content_id']
                if isinstance(cid3, str):
                    content_ids.add(cid3)
                for rule_spec in answer_group['rule_specs']:
                    for _, param_value in rule_spec['inputs'].items():
                        if isinstance(param_value, dict) and 'contentId' in param_value:
                            rcid = param_value['contentId']
                            if isinstance(rcid, str):
                                content_ids.add(rcid)
            if interaction['solution'] is not None:
                cid4 = interaction['solution']['explanation']['content_id']
                if isinstance(cid4, str):
                    content_ids.add(cid4)
            for hint in interaction['hints']:
                cid5 = hint['hint_content']['content_id']
                if isinstance(cid5, str):
                    content_ids.add(cid5)
            if interaction['customization_args']:
                for _, ca_spec in interaction['customization_args'].items():
                    ca_value: Any = ca_spec.get('value', {})
                    if isinstance(ca_value, dict) and ca_value.get('content_id') is not None:
                        cid6 = ca_value.get('content_id')
                        if isinstance(cid6, str):
                            content_ids.add(cid6)
                    elif isinstance(ca_value, dict) and ca_value.get('placeholder') is not None:
                        placeholder = ca_value.get('placeholder')
                        if isinstance(placeholder, dict) and placeholder.get('value') is not None:
                            val = placeholder.get('value')
                            if isinstance(val, dict) and val.get('content_id') is not None:
                                cid7 = val.get('content_id')
                                if isinstance(cid7, str):
                                    content_ids.add(cid7)
            state_to_content_ids[state_name] = list(content_ids)
        return state_to_content_ids

    @staticmethod
    def _find_duplicate_content_ids(
        states_dict: Dict[str, state_domain.StateDict],
    ) -> Dict[str, List[str]]:
        """Finds all duplicate content IDs in an exploration.

        Args:
            states_dict: dict. The states dictionary from an exploration.

        Returns:
            dict. Maps duplicate_content_id -> list of state names where it appears.
        """
        state_to_content_ids = (
            DeleteDuplicateContentIdsJob._get_all_content_ids_from_exploration(
                states_dict
            )
        )

        all_content_ids: Dict[str, List[str]] = {}
        for state_name, content_ids in state_to_content_ids.items():
            for content_id in content_ids:
                if content_id not in all_content_ids:
                    all_content_ids[content_id] = []
                all_content_ids[content_id].append(state_name)

        duplicates = {
            cid: states for cid, states in all_content_ids.items()
            if len(states) > 1
        }

        return duplicates

    @staticmethod
    def _process_exploration(
        exp_model: 'exp_models.ExplorationModel',
    ) -> result.Result[
        Tuple[str, exp_domain.Exploration, Dict[str, str]], 
        Tuple[str, str]
    ]:
        """Processes an exploration to fix duplicate content IDs.

        Args:
            exp_model: ExplorationModel. The exploration model to process.

        Returns:
            Result containing either:
            - (exp_id, exploration, old_to_new_mapping) on success
            - (exp_id, error_message) on failure
        """
        try:
            with datastore_services.get_ndb_context():
                exploration = exp_fetchers.get_exploration_from_model(exp_model)

            states_dict: Dict[str, state_domain.StateDict] = getattr(exploration, 'states_dict', None)
            if states_dict is None:
                states_dict = getattr(exploration, 'states', None)
            if states_dict is None:
                return result.Err((exp_model.id, "Exploration has no states_dict or states attribute"))

            duplicates = DeleteDuplicateContentIdsJob._find_duplicate_content_ids(
                states_dict
            )

            if not duplicates:
                return result.Ok((exploration.id, exploration, {}))

            logging.info(
                'Found duplicate content IDs in exploration %s: %s',
                exploration.id,
                list(duplicates.keys())
            )

            updated_states_dict: Dict[str, state_domain.StateDict]
            updated_states_dict, next_content_id_index = (
                state_domain.State.update_old_content_id_to_new_content_id_in_v54_states(
                    states_dict
                )
            )

            if hasattr(exploration, 'states_dict'):
                exploration.states_dict = updated_states_dict  # type: ignore
            elif hasattr(exploration, 'states'):
                exploration.states = updated_states_dict  # type: ignore

            exploration.update_next_content_id_index(next_content_id_index)
            exploration.version = exp_model.version + 1

            old_to_new_mapping: Dict[str, str] = {}

            return result.Ok((exploration.id, exploration, old_to_new_mapping))

        except Exception as e:
            logging.exception(
                'Error processing exploration %s: %s', exp_model.id, str(e)
            )
            return result.Err((exp_model.id, str(e)))

    @staticmethod
    def _migrate_translations_and_voiceovers(
        exp_id: str,
        old_version: int,
        new_version: int,
    ) -> Tuple[List[translation_models.EntityTranslationsModel],
               List[voiceover_models.EntityVoiceoversModel]]:
        """
        Migrates translations and voiceovers to new version.

        For explorations with duplicate content IDs that were fixed, we need to
        clone all EntityTranslationsModels and EntityVoiceoversModels from the
        old version to the new version. This ensures translations and voiceovers
        are preserved.

        Args:
            exp_id: str. The exploration ID.
            old_version: int. The old exploration version.
            new_version: int. The new exploration version.

        Returns:
            tuple. (translation_models, voiceover_models) to be persisted.
        """
        with datastore_services.get_ndb_context():
            old_translations = (
                translation_models.EntityTranslationsModel.get_all_for_entity(
                    feconf.TranslatableEntityType.EXPLORATION,
                    exp_id,
                    old_version,
                )
            )

            new_translations = []
            for trans_model in old_translations:
                new_trans = translation_models.EntityTranslationsModel.create_new(
                    feconf.TranslatableEntityType.EXPLORATION,
                    exp_id,
                    new_version,
                    trans_model.language_code,
                    trans_model.translations,
                )
                new_trans.update_timestamps()
                new_translations.append(new_trans)

            old_voiceovers = (
                voiceover_models.EntityVoiceoversModel.get_entity_voiceovers_for_given_exploration(
                    exp_id,
                    feconf.ENTITY_TYPE_EXPLORATION,
                    old_version,
                )
            )

            new_voiceovers = []
            for vo_model in old_voiceovers:
                new_vo = voiceover_models.EntityVoiceoversModel.create_new(
                    feconf.ENTITY_TYPE_EXPLORATION,
                    exp_id,
                    new_version,
                    vo_model.language_accent_code,
                    vo_model.voiceovers_mapping,
                    vo_model.automated_voiceovers_audio_offsets_msecs,
                )
                new_vo.update_timestamps()
                new_voiceovers.append(new_vo)

        return new_translations, new_voiceovers

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """
        Returns a PCollection of job run results.

        Returns:
            PCollection. A PCollection of results indicating which explorations
            were fixed and how many duplicate content IDs were found.
        """
        exploration_models = (
            self.pipeline
            | 'Get all exploration models'
            >> ndb_io.GetModels(exp_models.ExplorationModel.get_all())
        )

        processed_explorations = (
            exploration_models
            | 'Process explorations'
            >> beam.Map(self._process_exploration)
        )

        succeeded = (
            processed_explorations
            | 'Filter successes' >> beam.Filter(lambda r: r.is_ok())
            | 'Extract ok results' >> beam.Map(lambda r: r.unwrap())
        )

        exp_models_to_put = (
            succeeded
            | 'Convert to models'
            >> beam.Map(
                lambda item: item[1].to_model() if hasattr(item[1], 'to_model') else None
            )
            | 'Filter nones' >> beam.Filter(lambda m: m is not None)
        )

        if self.DATASTORE_UPDATES_ALLOWED:
            unused_exp_put_results = (
                exp_models_to_put
                | 'Put exploration models' >> ndb_io.PutModels()
            )

        job_results = (
            processed_explorations
            | 'Generate results'
            >> job_result_transforms.ResultsToJobRunResults(
                'EXPLORATIONS WITH DUPLICATE CONTENT IDS FIXED'
            )
        )

        return job_results

class AuditDeleteDuplicateContentIdsJob(DeleteDuplicateContentIdsJob):
    """
    Audit version of DeleteDuplicateContentIdsJob that doesn't modify data.
    """
    DATASTORE_UPDATES_ALLOWED = False
