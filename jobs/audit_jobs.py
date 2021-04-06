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
# TODO(#11475): All lint checks that ensure all jobs.transforms.*_audits modules
# are imported.
from jobs.decorators import audit_decorators
from jobs.transforms import base_model_audits
from jobs.transforms import user_audits # pylint: disable=unused-import
import python_utils

import apache_beam as beam

AUDITS_BY_KIND = audit_decorators.AuditsExisting.get_audits_by_kind()

KIND_BY_INDEX = list(AUDITS_BY_KIND.keys())
AUDITS_BY_INDEX = [AUDITS_BY_KIND[kind] for kind in KIND_BY_INDEX]


class AuditAllStorageModelsJob(base_jobs.JobBase):
    """Runs a comprehensive audit on every model in storage."""

    def run(self):
        """Returns a PCollection of audit errors aggregated from all models."""
        if self.job_options.model_getter is None:
            raise ValueError('JobOptions.model_getter must not be None')

        existing_models, deleted_models = (
            self.pipeline
            | 'Get all models' >> self.job_options.model_getter()
            | 'Partition by model.deleted' >> beam.Partition(
                lambda model, unused_num_partitions: int(model.deleted), 2)
        )

        models_of_kind_by_index = (
            existing_models
            # NOTE: Partition returns a statically-sized list of PCollections.
            # Creating partitions can be wasteful when there are only a few
            # items, like in our unit tests. In exchange, we can take advantage
            # of the high parallelizability of PCollections, which are designed
            # for huge datasets and parallel processing.
            #
            # Alternatively, we could have used GroupBy. However, that returns
            # an _iterable_ over the groups instead of a PCollection, and so it
            # is vulnerable to out-of-memory errors.
            #
            # Since this job is concerned with running audits on EVERY MODEL IN
            # STORAGE, Partition is the clear winner regardless of the overhead
            # we'll see in unit tests.
            | 'Split models into parallelizable PCollections' >> beam.Partition(
                lambda m, _, kinds: kinds.index(jobs_utils.get_model_kind(m)),
                # NOTE: Partition requires a hard-coded number of slices, it
                # cannot be used with dynamic numbers generated in a pipeline.
                # The KIND_BY_INDEX list satisfies this requirement, since it
                # is determined and finalized after importing all of the modules
                # that use the AuditsExisting decorator.
                len(KIND_BY_INDEX), KIND_BY_INDEX)
        )

        get_label = lambda audit, kind: 'Run %s on %s' % (audit.__name__, kind)
        audit_error_pcolls = [
            (models_of_kind | get_label(audit, kind) >> beam.ParDo(audit()))
            for kind, audits, models_of_kind in python_utils.ZIP(
                KIND_BY_INDEX, AUDITS_BY_INDEX, models_of_kind_by_index)
            if models_of_kind and audits
            for audit in audits
        ]

        audit_error_pcolls.append(
            deleted_models
            | 'Run ValidateDeletedModel on deleted models' >> beam.ParDo(
                base_model_audits.ValidateDeletedModel())
        )

        return audit_error_pcolls | 'Combine all audit errors' >> beam.Flatten()
