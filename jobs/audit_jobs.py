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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from jobs import base_jobs
from jobs import jobs_utils
from jobs.transforms import audits_registry
from jobs.transforms import base_model_audits
import python_utils

import apache_beam as beam

AUDIT_DO_FN_TYPES_BY_KIND = audits_registry.get_audit_do_fn_types_by_kind()
KIND_BY_INDEX = tuple(AUDIT_DO_FN_TYPES_BY_KIND.keys())


class AuditAllStorageModelsJob(base_jobs.JobBase):
    """Runs a comprehensive audit on every model in the datastore."""

    def run(self):
        """Returns a PCollection of audit errors aggregated from all models."""
        if self.job_options.model_getter is None:
            raise ValueError('JobOptions.model_getter must not be None')

        existing_models, deleted_models = (
            self.pipeline
            | 'Get all models' >> self.job_options.model_getter()
            | 'Partition by model.deleted' >> (
                beam.Partition(lambda model, _: int(model.deleted), 2))
        )

        models_of_kind_by_index = (
            existing_models
            # NOTE: Partition returns a statically-sized list of PCollections.
            # Creating partitions is wasteful when there are less items than
            # there are partitions, like in our unit tests. In exchange, in
            # production the job will be able to take advantage of the high
            # parallelizability of PCollections, which are designed for enormous
            # datasets and parallel processing.
            #
            # Alternatively, we could have used GroupBy. However, that returns
            # an _iterable_ of items rather than a PCollection, and so it is
            # vulnerable to out-of-memory errors.
            #
            # Since this job is concerned with running audits on EVERY MODEL IN
            # STORAGE, Partition is the clear winner regardless of the overhead
            # we'll see in unit tests.
            | 'Split models into parallelizable PCollections' >> beam.Partition(
                lambda m, _, kinds: kinds.index(jobs_utils.get_model_kind(m)),
                # NOTE: Partition requires a hard-coded number of slices; it
                # cannot be used with dynamic numbers generated in a pipeline.
                # KIND_BY_INDEX is a constant tuple so that requirement is
                # satisfied in this case.
                len(KIND_BY_INDEX), KIND_BY_INDEX)
        )

        audit_error_pcolls = [
            deleted_models
            | 'Apply ValidateDeletedModel on deleted models' >> (
                beam.ParDo(base_model_audits.ValidateDeletedModel()))
        ]

        model_groups = python_utils.ZIP(KIND_BY_INDEX, models_of_kind_by_index)
        for kind, models_of_kind in model_groups:
            # NOTE: Using extend() instead of append() because ApplyAuditDoFns
            # produces an iterable of PCollections rather than a single one.
            # NOTE: Label is missing because ApplyAuditDoFns labels itself.
            audit_error_pcolls.extend(models_of_kind | ApplyAuditDoFns(kind))

        return audit_error_pcolls | 'Combine audit results' >> beam.Flatten()


class ApplyAuditDoFns(beam.PTransform):
    """Runs every Audit DoFn targeting the models of a specific kind."""

    def __init__(self, kind):
        """Initializes a new ApplyAuditDoFns instance.

        Args:
            kind: str. The kind of models this PTransform will receive.
        """
        super(ApplyAuditDoFns, self).__init__(
            label='Apply every Audit DoFn targeting %s' % kind)
        self._kind = kind
        self._do_fn_types = tuple(AUDIT_DO_FN_TYPES_BY_KIND[kind])

    def expand(self, models_of_kind):
        """Returns audit errors from every Audit DoFn targeting the models.

        Args:
            models_of_kind: PCollection. Models of self._kind.

        Returns:
            iterable(PCollection). A chain of PCollections. Each individual one
            is the result of a specific DoFn, and is labeled as such.
        """
        return (
            models_of_kind
            | 'Apply %s on %s' % (f.__name__, self._kind) >> beam.ParDo(f())
            for f in self._do_fn_types
        )
