# coding: utf-8
#
# Copyright 2021 The Oppia Authors. All Rights Reserved.
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

"""Rejecting suggestions whose content_id no longer exists."""

from __future__ import annotations

import datetime

from core import feconf
from core.domain import exp_domain
from core.domain import exp_fetchers
from core.domain import state_domain
from core.domain import suggestion_registry
from core.domain import suggestion_services
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

import result

from typing import Dict, Iterable, Iterator, List, Optional, Set, Tuple, Union
from typing_extensions import TypedDict

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import suggestion_models

(exp_models, suggestion_models) = models.Registry.import_models([
    models.Names.EXPLORATION, models.Names.SUGGESTION
])

datastore_services = models.Registry.import_datastore_services()


class RejectSuggestionWithMissingContentIdJob(base_jobs.JobBase):
    """Job that rejects the suggestions for missing content ids."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """
        """
        suggestions_grouped_by_target = (
            self.pipeline
            | 'Get all non-deleted suggestion models' >> ndb_io.GetModels(
                suggestion_models.GeneralSuggestionModel.get_all(
                    include_deleted=False))
            | 'Filter translate suggestions' >> beam.Filter(
                lambda m: (
                    m.suggestion_type ==
                    feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT
                ))
            | 'Transform to suggestion domain object' >> beam.Map(
                suggestion_services.get_suggestion_from_model)
            | 'Group by target' >> beam.GroupBy(lambda m: m.target_id)
        )

        exploration_models = (
            self.pipeline
            | 'Get all non-deleted exploration models' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False))
            | 'Transform to exploration domain object' >> beam.Map(
                exp_fetchers.get_exploration_from_model)
            | 'Group by ID' >> beam.GroupBy(lambda m: m.id)
        )

        combine_exp_with_suggestion = (
            {
                'suggestion': suggestions_grouped_by_target,
                'exploration': exploration_models
            }
            | 'Merge models' >> beam.CoGroupByKey()
            | 'Remove keys' >> beam.Values()
            | 'Update suggestion status for missing content ids' >> beam.Map(
                self._update_suggestion_status
            )
        )

        updated_exp_models = (
            combine_exp_with_suggestion
            | 'Extracting only exp models' >> beam.Map(
                lambda exp_with_suggestions: exp_with_suggestions['exploration']
            )
            | 'Job run result for exps' >> (
                job_result_transforms.CountObjectsToJobRunResult())
        )

        updated_suggestion_models = (
            combine_exp_with_suggestion
            | 'Extracting only suggestion models' >> beam.Map(
                lambda exp_with_suggestions: exp_with_suggestions['suggestion']
            )
            | 'Job run result for suggestions' >> (
                job_result_transforms.CountObjectsToJobRunResult())
        )

        return (
            (
                updated_exp_models,
                updated_suggestion_models
            )
            | 'Merge job run results' >> beam.Flatten()
        )

    @staticmethod
    def _update_suggestion_status(exp_with_suggestion):
        """
        """
        if not len(exp_with_suggestion['suggestion']):
            return exp_with_suggestion
        suggestions: Iterable[suggestion_registry.SuggestionTranslateContent] = (
            exp_with_suggestion['suggestion'][0])
        exploration: exp_domain.Exploration = list(exp_with_suggestion[
            'exploration'][0])[0]

        exp_translatable_contents = (
            exploration.get_translatable_contents_collection())
        translatable_content_ids = []
        for content_id in (
            exp_translatable_contents.content_id_to_translatable_content.keys()
        ):
            translatable_content_ids.append(content_id)

        for suggestion in suggestions:
            suggestion_change = suggestion.change
            if not suggestion_change.content_id in translatable_content_ids:
                suggestion.status = 'rejected'
        return exp_with_suggestion
