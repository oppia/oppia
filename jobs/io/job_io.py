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

"""Provides PTransforms for writing job results to the datastore."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import beam_job_services
from core.platform import models
from jobs.io import ndb_io
from jobs.types import job_run_result

import apache_beam as beam

(beam_job_models,) = models.Registry.import_models([models.NAMES.beam_job])


@beam.typehints.with_input_types(job_run_result.JobRunResult)
@beam.typehints.with_output_types(beam.pvalue.PDone)
class PutResults(beam.PTransform):
    """Writes Job Results into the NDB datastore."""

    _MAX_RESULT_INSTANCES_PER_MODEL = 1000

    def __init__(self, job_id, datastoreio_stub, label=None):
        """Initializes the GetModels PTransform.

        Args:
            job_id: str. The Oppia ID associated with the current pipeline.
            datastoreio_stub: stub_io.DatastoreioStub. The stub responsible for
                handling datastoreio operations.
            label: str|None. The label of the PTransform.
        """
        super(PutResults, self).__init__(label=label)
        self.job_id = job_id
        self.datastoreio_stub = datastoreio_stub

    def expand(self, results):
        """Writes the given job results to the NDB datastore."""
        return (
            results
            # NOTE: Pylint is wrong. WithKeys() is a decorated function with a
            # different signature than the one it's defined with.
            | beam.WithKeys(None) # pylint: disable=no-value-for-parameter
            # GroupIntoBatches() requires (key, value) pairs as input, so we
            # give everything None keys and then immediately discard them.
            | beam.GroupIntoBatches(self._MAX_RESULT_INSTANCES_PER_MODEL)
            | beam.Values()
            | beam.FlatMap(job_run_result.JobRunResult.accumulate)
            | beam.Map(self.create_beam_job_run_result_model)
            | ndb_io.PutModels(self.datastoreio_stub)
        )

    def create_beam_job_run_result_model(self, result):
        """Returns an NDB model for storing the given JobRunResult.

        Args:
            result: job_run_result.JobRunResult. The result.

        Returns:
            BeamJobRunResultModel. The NDB model.
        """
        return beam_job_services.create_beam_job_run_result_model(
            self.job_id, result.stdout, result.stderr)
