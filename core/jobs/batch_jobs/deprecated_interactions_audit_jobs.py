# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Audit job for deprecated interactions and their creator/editor emails."""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import (
    Final,
    Iterable,
    List,
    Optional,
    Set,
    Tuple,
    TypedDict,
)

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import exp_models, user_models

(exp_models, user_models) = models.Registry.import_models(
    [models.Names.EXPLORATION, models.Names.USER]
)

DEPRECATED_INTERACTION_IDS: Final = frozenset(
    {
        'CodeRepl',
        'GraphInput',
        'InteractiveMap',
        'MusicNotesInput',
        'PencilCodeEditor',
    }
)


class ExpDetailsDict(TypedDict):
    """Dictionary representing details of an affected exploration."""

    exp_id: str
    title: str
    interactions: List[str]


class GroupedExpAndRightsDict(TypedDict):
    """Dictionary representing joined exploration details and rights."""

    exp_details: List[ExpDetailsDict]
    rights: List[exp_models.ExplorationRightsModel]


class GroupedUserDataDict(TypedDict):
    """Dictionary representing joined user data and exploration details."""

    exp_details_list: List[List[ExpDetailsDict]]
    user_settings: List[user_models.UserSettingsModel]


class AuditDeprecatedInteractionsJob(base_jobs.JobBase):
    """Audit job that identifies explorations with deprecated interactions,
    maps them to their owners and editors, and outputs each user's email
    along with their affected explorations.
    """

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        affected_exps = (
            self.pipeline
            | 'Get all ExplorationModels'
            >> ndb_io.GetModels(exp_models.ExplorationModel.get_all())
            | 'Filter explorations with deprecated interactions'
            >> beam.Filter(self._has_deprecated_interactions)
            | 'Map to exp ID and details' >> beam.Map(self._extract_exp_details)
        )

        exp_rights = (
            self.pipeline
            | 'Get all ExplorationRightsModels'
            >> ndb_io.GetModels(exp_models.ExplorationRightsModel.get_all())
            | 'Key rights by exp ID'
            >> beam.Map(lambda model: (model.id, model))
        )

        user_settings = (
            self.pipeline
            | 'Get all UserSettingsModels'
            >> ndb_io.GetModels(user_models.UserSettingsModel.get_all())
            | 'Key user settings by user ID'
            >> beam.Map(lambda model: (model.id, model))
        )

        user_exp_pairs = (
            {
                'exp_details': affected_exps,
                'rights': exp_rights,
            }
            | 'Join exp details with rights' >> beam.CoGroupByKey()
            | 'Filter affected explorations with details'
            >> beam.Filter(lambda item: len(item[1]['exp_details']) > 0)
            | 'Map to user and exp details'
            >> beam.FlatMapTuple(self._map_exp_to_users)
        )

        unowned_exp_results = (
            user_exp_pairs
            | 'Filter unowned explorations'
            >> beam.Filter(lambda item: item[0] is None)
            | 'Format unowned exploration results'
            >> beam.Map(
                lambda item: job_run_result.JobRunResult.as_stdout(
                    f"Unowned Exploration: ID: {item[1]['exp_id']}, "
                    f"Title: '{item[1]['title']}', "
                    f"Interactions: {item[1]['interactions']}"
                )
            )
        )

        owned_users_to_exps = (
            user_exp_pairs
            | 'Filter owned explorations'
            >> beam.Filter(lambda item: item[0] is not None)
            | 'Group explorations by user ID' >> beam.GroupByKey()
        )

        user_notification_results = (
            {
                'exp_details_list': owned_users_to_exps,
                'user_settings': user_settings,
            }
            | 'Join user with settings' >> beam.CoGroupByKey()
            | 'Filter users with affected explorations'
            >> beam.Filter(lambda item: len(item[1]['exp_details_list']) > 0)
            | 'Format user audit results'
            >> beam.MapTuple(self._format_user_audit_result)
        )

        return (
            unowned_exp_results,
            user_notification_results,
        ) | 'Merge audit results' >> beam.Flatten()

    @staticmethod
    def _has_deprecated_interactions(
        model: exp_models.ExplorationModel,
    ) -> bool:
        """Checks if the exploration contains any state with a deprecated
        interaction.
        """
        for state in model.states.values():
            if isinstance(state, dict):
                interaction = state.get('interaction')
                if isinstance(interaction, dict):
                    if interaction.get('id') in DEPRECATED_INTERACTION_IDS:
                        return True
        return False

    @staticmethod
    def _extract_exp_details(
        model: exp_models.ExplorationModel,
    ) -> Tuple[str, ExpDetailsDict]:
        """Extracts the exploration ID and summary of deprecated
        interactions.
        """
        deprecated_interactions: Set[str] = set()
        for state in model.states.values():
            if isinstance(state, dict):
                interaction = state.get('interaction')
                if isinstance(interaction, dict):
                    interaction_id = interaction.get('id')
                    if (
                        isinstance(interaction_id, str)
                        and interaction_id in DEPRECATED_INTERACTION_IDS
                    ):
                        deprecated_interactions.add(interaction_id)

        exp_details: ExpDetailsDict = {
            'exp_id': model.id,
            'title': model.title,
            'interactions': sorted(deprecated_interactions),
        }
        return (model.id, exp_details)

    @staticmethod
    def _map_exp_to_users(
        unused_exp_id: str,
        grouped_exp_and_rights: GroupedExpAndRightsDict,
    ) -> Iterable[Tuple[Optional[str], ExpDetailsDict]]:
        """Maps an affected exploration to its owner and editor user IDs.
        If no owner or editor exists, yields (None, exp_details).
        """
        exp_details: ExpDetailsDict = grouped_exp_and_rights['exp_details'][0]
        rights_models = grouped_exp_and_rights['rights']

        user_ids: Set[str] = set()
        if len(rights_models) > 0:
            rights_model = rights_models[0]
            user_ids.update(rights_model.owner_ids)
            user_ids.update(rights_model.editor_ids)

        if not user_ids:
            yield (None, exp_details)
        else:
            for user_id in sorted(user_ids):
                yield (user_id, exp_details)

    @staticmethod
    def _format_user_audit_result(
        user_id: str,
        grouped_user_data: GroupedUserDataDict,
    ) -> job_run_result.JobRunResult:
        """Formats the audit output for a user and their affected
        explorations.
        """
        raw_exp_details: Iterable[ExpDetailsDict] = grouped_user_data[
            'exp_details_list'
        ][0]
        unique_exps_by_id = {exp['exp_id']: exp for exp in raw_exp_details}
        sorted_exps = sorted(
            unique_exps_by_id.values(), key=lambda e: e['exp_id']
        )

        user_settings_models = grouped_user_data['user_settings']
        match user_settings_models:
            case [user_settings]:
                username = user_settings.username or 'None'
                email = user_settings.email
            case _:
                username = 'UNKNOWN_USER'
                email = 'UNKNOWN_EMAIL'

        formatted_exps_str = ', '.join(
            f"('{exp['exp_id']}', '{exp['title']}', {exp['interactions']})"
            for exp in sorted_exps
        )

        return job_run_result.JobRunResult.as_stdout(
            f"User: {username}, Email: {email}, User ID: {user_id}, "
            f"Affected Explorations: [{formatted_exps_str}]"
        )
