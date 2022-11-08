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

"""Provides an Apache Beam API for operating on NDB models."""

from __future__ import annotations

import apache_beam as beam
import result
from typing import Any, Optional, Tuple


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that PTransform class is of type Any. Thus to avoid MyPy's error
# (Class cannot subclass 'PTransform' (has type 'Any')), we added an
# ignore here.
class FilterResults(beam.PTransform):  # type: ignore[misc]
    """Transform that flushes an input PCollection if any error results
       are encountered..
    """

    def __init__(
        self, prefix: Optional[str] = None, label: Optional[str] = None
    ) -> None:
        """Initializes the FilterResults PTransform.

        Args:
            prefix: str|None. The prefix for the result string.
            label: str|None. The label of the PTransform.
        """
        super().__init__(label=label)
        self.prefix = '%s ' % prefix if prefix else ''

    @staticmethod
    def _check_migration_errors(
        unused_result: result.Result[Tuple[str, Any], Tuple[str, Exception]],
        is_no_migration_error: beam.pvalue.AsSingleton
    ) -> bool:
        """Checks if any errors have occured.

        Args:
            unused_result: result.Result. Unused Result object.
            is_no_migration_error: beam.pvalue.AsSingleton. Side input data
                specifying non-zero erros during migration.

        Returns:
            bool. Specifies whether any migration errors were found.
        """
        return bool(is_no_migration_error)

    # Here we use type Any because this method can accept any kind of
    # Pcollection object to return the unique JobRunResult objects
    # with count.
    def expand(
        self, objects: beam.PCollection[result.Result[Tuple[str, Any], Tuple[str, Exception]]] # pylint: disable=line-too-long
    ) -> beam.PCollection[Any]:
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
                self._check_migration_errors,
                is_no_migration_error=beam.pvalue.AsSingleton(
                    error_check))
        )
        return filtered_results
