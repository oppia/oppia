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

"""Migration Jobs for subtopic page models"""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import exp_fetchers
from jobs import job_utils
from jobs.types import job_run_result
import feconf

import apache_beam as beam

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])


class PopulateExplorationWithProtoSize(base_jobs.JobBase):
    """Update the proto_size_in_bytes in exploration models."""

    def run(self):
        exploration_model_query = exp_models.ExplorationModel.query()
        migrated_models = (
            self.pipeline
            | 'Get every Exploration Model' >> ndb_io.GetModels(
                exploration_model_query, self.datastoreio_stub)
            | 'Update Exploration Model' >>
            beam.ParDo(UpdateProtoSizeInBytes()))

        # Save the successfully migrated models.
        _ = migrated_models | ndb_io.PutMulti()
        success_message = (
            migrated_models
            | beam.combiners.Count.Globally()
            | beam.Map(lambda count: '%d models sucessfully stored')
            | beam.Map(job_run_result.JobRunResult.as_stdout)
        )

        error_messages = (
            migrated_models.error
            | beam.Map(job_run_result.JobRunResult.as_stderr)
        )

        return (success_message, error_messages) | beam.Flatten()

class UpdateProtoSizeInBytes(beam.DoFn):

    def process(self, input_model):
        if (input_model.proto_size_in_bytes == 0:
            model = job_utils.clone_model(input_model)
            try:
                # Fetching corresponding domain object here to run the
                # validate() function on it.
                old_exploration = exp_fetchers.get_exploration_from_model(model)
                old_exploration.validate()
                # Calculate the proto size.
                model.proto_size_in_bytes = 1
            except Exception as e:
                error_message = (
                    'Exploration Model %s failed to update proto_size_in_bytes: %s'
                    % (model.id, e))
                yield beam.pvalue.TaggedOutput('error', error_message)
            else:
                yield model
