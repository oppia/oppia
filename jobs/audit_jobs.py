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
from jobs.decorators import audit_decorators
from jobs.transforms import base_model_audits

import apache_beam as beam

# IMPORTANT: DO NOT REMOVE THIS IMPORT! It triggers all of the audit decorators.
# The audit decorators register which kinds of models a DoFn should apply to,
# and AuditAllStorageModelsJob uses the registry to programmatically apply them.
from jobs.transforms import * # isort:skip  pylint: disable=import-only-modules, ungrouped-imports, wildcard-import, wrong-import-position, wrong-import-order


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

        # TODO(#11475): Implement "ValidateModelRelationships" using this pcoll.
        kind_and_existing_model_pairs = (
            existing_models
            | 'Map existing models to (kind, model) pairs' >> beam.Map(
                lambda model: (jobs_utils.get_model_kind(model), model))
        )

        audits_by_kind = audit_decorators.AuditsExisting.get_audits_by_kind()
        kind_and_audit_class_pairs = (
            self.pipeline
            | 'Compute the predefined (kind, audit class) pairs' >> beam.Create(
                (kind, audit_class)
                for kind, audit_classes in audits_by_kind.items()
                for audit_class in audit_classes)
        )

        existing_model_errors = (
            (kind_and_existing_model_pairs, kind_and_audit_class_pairs)
            | 'Join models and audit classes by kind' >> beam.CoGroupByKey()
            | 'Filter empty joins' >> beam.Filter(self._is_non_empty_join)
            | 'Audit the models' >> beam.FlatMap(self._audit_models)
        )

        deleted_model_errors = (
            deleted_models
            | 'Run ValidateDeletedModel on deleted models' >> beam.ParDo(
                base_model_audits.ValidateDeletedModel())
        )

        return (
            (existing_model_errors, deleted_model_errors)
            | 'Combine errors' >> beam.Flatten()
        )

    def _audit_models(self, join_result):
        """Runs each of the audit DoFns on each of the models.

        Args:
            join_result: tuple(str, tuple(PCollection, PCollection)). The output
                from CoGroupByKey.

        Returns:
            PCollection. An aggregate PCollection of errors from the audits.
        """
        kind, (models, audit_classes) = join_result
        audit_error_pcolls = (
            models | 'Run %s on %ss' % (cls.__name__, kind) >> beam.ParDo(cls())
            for cls in audit_classes
        )
        return audit_error_pcolls | beam.Flatten()

    def _is_non_empty_join(self, join_result):
        """Returns whether the joined pair of (models, audit_classes) are empty.

        Args:
            join_result: tuple(str, tuple(PCollection, PCollection)). The output
                from CoGroupByKey.

        Returns:
            bool. Whether both the models and audit classes are not empty.
        """
        _, (models, audit_classes) = join_result
        return models and audit_classes
