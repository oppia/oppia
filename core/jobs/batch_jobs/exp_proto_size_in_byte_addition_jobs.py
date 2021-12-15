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

"""Jobs for adding proto_size_in_bytes attribute to exploration."""

from __future__ import annotations

from core import feconf
from core.jobs import base_jobs
from core.jobs.io import ndb_io

import apache_beam as beam

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import exp_models

(exp_models,) = models.Registry.import_models([models.NAMES.exploration])


class AddProtoSizeInBytesToExplorationJob(base_jobs.JobBase):
    """Job that add the proto_size_in_bytes attribute."""

    # 1. Create pipeline
    #    1.1 Load model from ExplorationModel
    #    1.2 Write updated model to datastore.

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of 'SUCCESS' or 'FAILURE' results from
        the attribute addition.

        Returns:
            PCollection. A PCollection of 'SUCCESS' or 'FAILURE' results from
            the attribute addition.
        """
        return (
            self.pipeline
            | 'Get all non-deleted models' >> (
                ndb_io.GetModels(
                    exp_models.ExplorationModel.get_all(include_deleted=False)))
            | MigrateExplorationToVersion55()
            | 'Write updated model to Datastore'
        )


class MigrateExplorationToVersion55(beam.DoFn):

    def process(self, input_model):
        if input_model.schema_version < exp_models.ExplorationModel.get_all(include_deleted=False): # pylint: disable=line-too-long
            model = job_utils.clone_model(input_model)
            # Migrate the model here.
            yield model
