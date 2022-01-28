
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

"""Validation Jobs for title exploration"""

from core.domain import exp_fetchers
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

(exp_models, ) = models.Registry.import_models([models.NAMES.exploration])


class GetNumberOfExpExceedsMaxTitleLengthJob(base_jobs.JobBase):

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        return (
            self.pipeline
            | 'Get all ExplorationModels' >> ndb_io.GetModels(
                exp_models.ExplorationModel.get_all(include_deleted=False))
            | 'Get exploration from model' >> beam.Map(
                exp_fetchers.get_exploration_from_model)
            | 'Combine exploration title and ids' >> beam.Map(
                lambda exp: (exp.id, exp.title))
            | 'Filter exploraton with title length greater than 36' >> beam.Filter(
                lambda exp: len(exp[1]) > 36)
            | 'id of exploration' >> beam.Map(
                lambda exp: exp[0])
            | 'Map as stdout' >> beam.Map(job_run_result.JobRunResult.as_stdout)
        )
