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

"""Provides an Apache Beam API for operating on NDB models."""

from __future__ import annotations

from core.jobs.types import job_run_result

import apache_beam as beam
import result
from typing import Any, Optional, Tuple


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error
# (Class cannot subclass 'PTransform' (has type 'Any')), we added an
# ignore here.
class ResultsToJobRunResults(beam.PTransform):  # type: ignore[misc]
    """Transforms result.Result into job_run_result.JobRunResult."""

    def __init__(
        self, prefix: Optional[str] = None, label: Optional[str] = None
    ) -> None:
        """Initializes the ResultsToJobRunResults PTransform.

        Args:
            prefix: str|None. The prefix for the result string.
            label: str|None. The label of the PTransform.
        """
        super().__init__(label=label)
        self.prefix = '%s ' % prefix if prefix else ''

    # This is needed because the Beam annotations validator doesn't properly
    # work with result.Result.
    # TODO(#15613): Here we use MyPy ignore because the decorator
    # no_annotations is not type annotated yet in apache_beam library,
    # which causes MyPy to throw untyped decorator error. So to silent
    # the error, we used ignore here.
    # Here we use type Any because this method is a generalized method which
    # converts transform_results to a job_run_results. So, to allow all types
    # of transform results, we used Any type here.
    @beam.typehints.no_annotations  # type: ignore[misc]
    def _transform_result_to_job_run_result(
        self, result_item: result.Result[Any, Any]
    ) -> job_run_result.JobRunResult:
        """Transforms Result objects into JobRunResult objects. When the result
        is Ok then transform it into stdout, if the result is Err transform it
        into stderr.

        Args:
            result_item: Result. The result object.

        Returns:
            JobRunResult. The JobRunResult object.
        """
        if isinstance(result_item, result.Ok):
            return job_run_result.JobRunResult.as_stdout(
                '%sSUCCESS:' % self.prefix
            )
        else:
            return job_run_result.JobRunResult.as_stderr(
                '%sERROR: "%s":' % (self.prefix, result_item.value)
            )

    @staticmethod
    def _add_count_to_job_run_result(
        job_result_and_count: Tuple[job_run_result.JobRunResult, int]
    ) -> job_run_result.JobRunResult:
        """Adds count to the stdout or stderr of the JobRunResult.

        Args:
            job_result_and_count: tuple(JobRunResult, int). Tuple containing
                unique JobRunResult and their counts.

        Returns:
            JobRunResult. JobRunResult objects with counts added.
        """
        job_result, count = job_result_and_count
        if job_result.stdout:
            job_result.stdout += ' %s' % str(count)
        if job_result.stderr:
            job_result.stderr += ' %s' % str(count)
        return job_result

    # This is needed because the Beam annotations validator doesn't properly
    # work with result.Result.
    # TODO(#15613): Here we use MyPy ignore because the decorator
    # no_annotations is not type annotated yet in apache_beam library,
    # which causes MyPy to throw untyped decorator error. So to silent
    # the error, we used ignore here.
    # Here we use type Any because this method can accept any kind of
    # Pcollection results to return the unique JobRunResult objects
    # with count.
    @beam.typehints.no_annotations  # type: ignore[misc]
    def expand(
        self, results: beam.PCollection[result.Result[Any, Any]]
    ) -> beam.PCollection[job_run_result.JobRunResult]:
        """Transforms Result objects into unique JobRunResult objects and
        adds counts to them.

        Args:
            results: PCollection. Sequence of Result objects.

        Returns:
            PCollection. Sequence of unique JobRunResult objects with count.
        """
        return (
            results
            | 'Transform result to job run result' >> beam.Map(
                self._transform_result_to_job_run_result)
            | 'Count all elements' >> beam.combiners.Count.PerElement()
            | 'Add count to job run result' >> beam.Map(
                self._add_count_to_job_run_result)
        )


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error
# (Class cannot subclass 'PTransform' (has type 'Any')), we added an
# ignore here.
class CountObjectsToJobRunResult(beam.PTransform):  # type: ignore[misc]
    """Transform that counts number of objects in a sequence and puts
    the count into job_run_result.JobRunResult.
    """

    def __init__(
        self, prefix: Optional[str] = None, label: Optional[str] = None
    ) -> None:
        """Initializes the ResultsToJobRunResults PTransform.

        Args:
            prefix: str|None. The prefix for the result string.
            label: str|None. The label of the PTransform.
        """
        super().__init__(label=label)
        self.prefix = '%s ' % prefix if prefix else ''

    # Here we use type Any because this method can accept any kind of
    # Pcollection object to return the unique JobRunResult objects
    # with count.
    def expand(
        self, objects: beam.PCollection[Any]
    ) -> beam.PCollection[job_run_result.JobRunResult]:
        """Counts items in collection and puts the count into a job run result.

        Args:
            objects: PCollection. Sequence of any objects.

        Returns:
            PCollection. Sequence of one JobRunResult with count.
        """
        return (
            objects
            | 'Count all new models' >> beam.combiners.Count.Globally()
            | 'Only create result for non-zero number of objects' >> (
                beam.Filter(lambda x: x > 0))
            | 'Add count to job run result' >> beam.Map(
                lambda object_count: job_run_result.JobRunResult.as_stdout(
                    '%sSUCCESS: %s' % (self.prefix, object_count)
                ))
        )
