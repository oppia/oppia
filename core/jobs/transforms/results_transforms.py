# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Provides a transform to drain PCollection in case of an error."""

from __future__ import annotations

import apache_beam as beam
import result
from typing import Any, Tuple


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error
# (Class cannot subclass 'PTransform' (has type 'Any')), we added an
# ignore here.
class DrainResultsOnError(beam.PTransform):  # type: ignore[misc]
    """Transform that flushes an input PCollection if any error results
       are encountered.
    """

    # Here we use type Any because this method can accept any kind of
    # PCollection object to return the filtered migration results.
    def expand(
        self, objects: beam.PCollection[result.Result[Tuple[str, Any], Tuple[str, Exception]]] # pylint: disable=line-too-long
    ) -> beam.PCollection[result.Result[Tuple[str, Any], None]]:
        """Count error results in collection and flush the input
            in case of errors.

        Args:
            objects: PCollection. Sequence of Result objects.

        Returns:
            PCollection. Sequence of Result objects or empty PCollection.
        """

        error_check = (
            objects
            | 'Filter errors' >> beam.Filter(
                lambda result_item: result_item.is_err())
            | 'Count number of errors' >> beam.combiners.Count.Globally()
            | 'Check if error count is zero' >> beam.Map(lambda x: x == 0)
        )

        filtered_results = (
            objects
            | 'Remove all results in case of errors' >> beam.Filter(
                lambda _, no_migration_error: bool(no_migration_error),
                no_migration_error=beam.pvalue.AsSingleton(
                    error_check))
        )
        return filtered_results
