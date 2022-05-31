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

"""Jobs that migrate suggestion models."""

from __future__ import annotations

import datetime
from email.mime import base

from core import feconf
from core.domain import exp_domain, exp_fetchers
from core.domain import exp_services
from core.domain import html_cleaner
from core.domain import opportunity_domain
from core.domain import opportunity_services
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
from typing import Dict, Iterable, Optional, Tuple, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import datastore_services
    from mypy_imports import opportunity_models
    from mypy_imports import suggestion_models
    from mypy_imports import exp_models

(opportunity_models, suggestion_models) = models.Registry.import_models(
    [models.NAMES.opportunity, models.NAMES.suggestion])

datastore_services = models.Registry.import_datastore_services()


class RegenerateContentIdForTranslationSuggestionsInReview(base_jobs.JobBase):
    """Regenerate content_id field for suggestions in review."""

    def _update_content_id_in_translation_suggestion(suggestion, exp_id_to_exp):
        if suggestion.target_id not in exp_id_to_exp:
            return result.Err(
                (suggestion.target_id, 'Exploration ID is invalid'))
        exploration = exp_id_to_exp[suggestion.target_id]
        states_dict = {}
        for state_name in exploration.states:
            states_dict[state_name] = exploration.states[state_name].to_dict()
        (old_content_id_to_new_content_id, _) = (
            state_domain
            .generate_old_content_id_to_new_content_id_in_v49_states(
                states_dict))
        if suggestion.change.content_id not in old_content_id_to_new_content_id:
            return result.Err(
                (
                    suggestion.target_id,
                    'Content ID %s does not exist in the exploration'
                    % suggestion.change.content_id
                )
            )
        
        

    def run(self):
        unmigrated_translation_suggestions_pcoll = (
            self.pipeline
            | 'Get all GeneralSuggestionModels' >> ndb_io.GetModels(
                suggestion_models.GeneralSuggestionModel.get_all(
                    include_deleted=False))
            | 'Filter translation suggestions in review' >> (
                beam.Filter(
                    lambda model, _: (
                        model.suggestion_type ==
                        feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT
                        and model.status == suggestion_models.STATUS_IN_REVIEW
                    ),
                ))
            | 'Transform to suggestion domain object' >> beam.Map(
                suggestion_services.get_suggestion_from_model)
            | 'Group by target' >> beam.GroupBy(lambda m: m.target_id)
        )

        explorations = (
            self.pipeline
            | 'Get all exploration models' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(
                    include_deleted=False))
            # We need to window the models so that CoGroupByKey below
            # works properly.
            | 'Transform to exploration domain object' >> beam.Map(
                exp_fetchers.get_exploration_from_model)
            | 'Group by ID' >> beam.GroupBy(lambda m: m.id)
        )
        exp_id_to_exp = beam.pvalue.AsDict(explorations)
        migrated_suggestion_results = (
            unmigrated_translation_suggestions_pcoll
            | 'Transform and migrate model' >> beam.MapTuple(
                self._update_content_id_in_translation_suggestion,
                exp_id_to_exp=exp_id_to_exp)
        )
        user_stats_results = (
            {
                'suggestions': unmigrated_translation_suggestion_models_pcoll,
                'explorations': explorations
            }
            | 'Merge models' >> beam.CoGroupByKey()
            | 'Get rid of key' >> beam.Values()  # pylint: disable=no-value-for-parameter
            | 'Generate stats' >> beam.ParDo(
                lambda x: self._generate_stats(
                    x['suggestion'][0] if len(x['suggestion']) else [],
                    list(x['opportunity'][0])[0]
                    if len(x['opportunity']) else None
                ))
        )

        user_stats_models = (
            user_stats_results
            | 'Filter ok results' >> beam.Filter(
                lambda key_and_result: key_and_result[1].is_ok())
            | 'Unpack result' >> beam.MapTuple(
                lambda key, result: (key, result.unwrap()))
            | 'Combine the stats' >> beam.CombinePerKey(CombineStats())
            | 'Generate models from stats' >> beam.MapTuple(
                self._generate_translation_contribution_model)
        )

        user_stats_error_job_run_results = (
            user_stats_results
            | 'Filter err results' >> beam.Filter(
                lambda key_and_result: key_and_result[1].is_err())
            # Pylint disable is needed because pylint is not able to correctly
            # detect that the value is passed through the pipe.
            | 'Remove keys' >> beam.Values()  # pylint: disable=no-value-for-parameter
            | 'Transform result to job run result' >> (
                job_result_transforms.ResultsToJobRunResults())
        )

        unused_put_result = (
            user_stats_models
            | 'Put models into the datastore' >> ndb_io.PutModels()
        )

        user_stats_models_job_run_results = (
            user_stats_models
            | 'Create job run result' >> (
                job_result_transforms.CountObjectsToJobRunResult())
        )

        return (
            (
                user_stats_error_job_run_results,
                user_stats_models_job_run_results
            )
            | 'Merge job run results' >> beam.Flatten()
        )
