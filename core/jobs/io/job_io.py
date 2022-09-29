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

from __future__ import annotations

from core.domain import beam_job_services
from core.jobs.io import ndb_io
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Optional

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import beam_job_models
    from mypy_imports import datastore_services

(beam_job_models,) = models.Registry.import_models([models.Names.BEAM_JOB])

datastore_services = models.Registry.import_datastore_services()


# TODO(#15613): Here we use MyPy ignore because of the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'PTransform' (has type 'Any')), we added an ignore here.
class PutResults(beam.PTransform): # type: ignore[misc]
    """Writes Job Results into the NDB datastore."""

    _MAX_RESULT_INSTANCES_PER_MODEL = 1000

    def __init__(self, job_id: str, label: Optional[str] = None) -> None:
        """Initializes the GetModels PTransform.

        Args:
            job_id: str. The Oppia ID associated with the current pipeline.
            label: str|None. The label of the PTransform.
        """
        super().__init__(label=label)
        self.job_id = job_id

    def expand(
        self, results: beam.PCollection[job_run_result.JobRunResult]
    ) -> beam.pvalue.PDone:
        """Writes the given job results to the NDB datastore.

        This overrides expand from parent class.

        Args:
            results: PCollection. Models, can also contain just one model.

        Returns:
            PCollection. An empty PCollection.
        """
        return (
            results
            # NOTE: Pylint is wrong. WithKeys() is a decorated function with a
            # different signature than the one it's defined with.
            | beam.WithKeys(None)  # pylint: disable=no-value-for-parameter
            # GroupIntoBatches() requires (key, value) pairs as input, so we
            # give everything None keys and then immediately discard them.
            | beam.GroupIntoBatches(self._MAX_RESULT_INSTANCES_PER_MODEL)
            | beam.Values() # pylint: disable=no-value-for-parameter
            | beam.FlatMap(job_run_result.JobRunResult.accumulate)
            | beam.Map(
                self.create_beam_job_run_result_model,
                results.pipeline.options.namespace)
            | ndb_io.PutModels()
        )

    def create_beam_job_run_result_model(
            self,
            result: job_run_result.JobRunResult,
            namespace: Optional[str]
    ) -> beam_job_models.BeamJobRunResultModel:
        """Returns an NDB model for storing the given JobRunResult.

        Args:
            result: job_run_result.JobRunResult. The result.
            namespace: str. The namespace in which models should be created.

        Returns:
            BeamJobRunResultModel. The NDB model.
        """
        with datastore_services.get_ndb_context(namespace=namespace):
            return beam_job_services.create_beam_job_run_result_model(
                self.job_id, result.stdout, result.stderr)
