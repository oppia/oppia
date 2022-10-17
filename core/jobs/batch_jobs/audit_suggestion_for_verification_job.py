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

from core import feconf
from core import utils
from core.domain import exp_fetchers
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
import bs4
import json

from typing import List, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models
    from mypy_imports import suggestion_models

(exp_models, suggestion_models) = models.Registry.import_models([
    models.Names.EXPLORATION, models.Names.SUGGESTION
])

datastore_services = models.Registry.import_datastore_services()


class AuditSuggestionJob(base_jobs.JobBase):
    """"""

    @staticmethod
    def _report_errors_from_suggestion_models():
        """"""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of results from the suggestion updation.

        Returns:
            PCollection. A PCollection of results from the suggestion
            migration.
        """
        target_id_to_suggestion_models = (
            self.pipeline
            | 'Get translation suggestion models in review' >> ndb_io.GetModels(
                suggestion_models.GeneralSuggestionModel.get_all(
                    include_deleted=False).filter(
                        (
                            suggestion_models
                            .GeneralSuggestionModel.suggestion_type
                        ) == feconf.SUGGESTION_TYPE_TRANSLATE_CONTENT
                    ).filter(
                        suggestion_models.GeneralSuggestionModel.status == (
                            suggestion_models.STATUS_IN_REVIEW
                        )
                    )
            )
            | 'Add target id as key' >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda model: model.target_id)
            | 'Group exploration suggestions' >> beam.GroupByKey()
        )

        exploration_models = (
            self.pipeline
            | 'Get all exploration models' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all())
            | 'Add exploration id as key' >> beam.WithKeys(  # pylint: disable=no-value-for-parameter
                lambda model: model.id)
        )

        errored_suggestion_results = (
            {
                'suggestions': target_id_to_suggestion_models,
                'exploration': exploration_models
            }
            | 'Merge models' >> beam.CoGroupByKey()
            | 'Remove keys' >> beam.Values()
            | 'Filter unwanted exploration' >> beam.Filter(
                lambda objects: len(objects['suggestions']) != 0)
            | 'Transform and migrate model' >> beam.Map(
                lambda objects: (
                    self._report_errors_from_suggestion_models(
                        objects['suggestions'][0],
                        objects['exploration'][0]
                    )
                ))
            | 'Flatten suggestion models' >> beam.FlatMap(lambda x: x)
        )
