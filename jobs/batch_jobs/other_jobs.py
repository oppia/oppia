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

"""Audit jobs that validate all of the storage models in the datastore."""

from __future__ import absolute_import
from __future__ import unicode_literals

from core.domain import search_services
from core.platform import models
from jobs import base_jobs
from jobs.io import ndb_io

import apache_beam as beam

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])


class IndexExplorationsInSearch(base_jobs.JobBase):
    """Job that indexes the explorations in Elastic Search."""

    MAX_BATCH_SIZE = 1000

    def _index_exploration_summaries(self, exp_summary_models):
        """Index exploration summaries and catch any errors.

        Args:
            exp_summary_models: list(ExpSummaryModel). Models to index.

        Returns:
            list(str). List containing one element, which is either SUCCESS,
            or FAILURE.

        """
        try:
            search_services.index_exploration_summaries(exp_summary_models)
            return ['SUCCESS']
        except:
            return ['FAILURE']

    def run(self):
        """Returns a PCollection of 'SUCCESS' or 'FAILURE' results from
        the Elastic Search.

        Returns:
            PCollection. A PCollection of 'SUCCESS' or 'FAILURE' results from
        the Elastic Search.
        """
        return (
            self.pipeline
            | 'Get all non-deleted models' >> (
                ndb_io.GetModels(
                    exp_models.ExpSummaryModel.get_all(include_deleted=False)))
            | 'Split models into batches' >> beam.transforms.util.BatchElements(
                max_batch_size=self.MAX_BATCH_SIZE)
            | 'Index batches of models' >> beam.ParDo(
                self._index_exploration_summaries)
        )

