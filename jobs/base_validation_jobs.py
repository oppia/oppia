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

import collections

from jobs import base_jobs
from jobs import job_utils
from jobs.transforms import base_validation
from jobs.transforms import base_validation_registry
from jobs.types import base_validation_errors
import python_utils

import apache_beam as beam

AUDIT_DO_FN_TYPES_BY_KIND = (
    base_validation_registry.
    get_audit_do_fn_types_by_kind())
KIND_BY_INDEX = tuple(AUDIT_DO_FN_TYPES_BY_KIND.keys())

# Type is: dict(str, tuple(tuple(ModelProperty, tuple(str)))). Tuples of type
# (ModelProperty, tuple(kind of models)), grouped by the kind of model the
# properties belong to.
ID_REFERENCING_PROPERTIES_BY_KIND_OF_POSSESSOR = (
    base_validation_registry.
    get_id_referencing_properties_by_kind_of_possessor())

# Type is: set(str). All model kinds referenced by one or more properties.
ALL_MODEL_KINDS_REFERENCED_BY_PROPERTIES = (
    base_validation_registry.get_all_model_kinds_referenced_by_properties())


class ModelKey(collections.namedtuple('ModelKey', ['model_kind', 'model_id'])):
    """Helper class for wrapping a (model kind, model ID) pair."""

    @classmethod
    def from_model(cls, model):
        """Creates a model key from the given model.

        Args:
            model: Model. The model to create a key for.

        Returns:
            ModelKey. The corresponding model key.
        """
        return cls(
            model_kind=job_utils.get_model_kind(model),
            model_id=job_utils.get_model_id(model))


class AuditAllStorageModelsJob(base_jobs.JobBase):
    """Runs a comprehensive audit on every model in the datastore."""

    def run(self):
        """Returns a PCollection of audit errors aggregated from all models.

        Returns:
            PCollection. A PCollection of audit errors discovered during the
            audit.

        Raises:
            ValueError. When the `model_getter` option, which should be the type
                of PTransform we will use to fetch models from the datastore, is
                None.
        """
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
            # Creating partitions is wasteful when there are fewer items than
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
                lambda m, _, kinds: kinds.index(job_utils.get_model_kind(m)),
                # NOTE: Partition requires a hard-coded number of slices; it
                # cannot be used with dynamic numbers generated in a pipeline.
                # KIND_BY_INDEX is a constant tuple so that requirement is
                # satisfied in this case.
                len(KIND_BY_INDEX), KIND_BY_INDEX)
        )

        existing_key_count_pcolls = []
        missing_key_error_pcolls = []
        audit_error_pcolls = [
            deleted_models
            | 'Apply ValidateDeletedModel on deleted models' >> (
                beam.ParDo(base_validation.ValidateDeletedModel()))
        ]

        model_groups = python_utils.ZIP(KIND_BY_INDEX, models_of_kind_by_index)
        for kind, models_of_kind in model_groups:
            audit_error_pcolls.extend(models_of_kind | ApplyAuditDoFns(kind))

            if kind in ALL_MODEL_KINDS_REFERENCED_BY_PROPERTIES:
                existing_key_count_pcolls.append(
                    models_of_kind | GetExistingModelKeyCounts(kind))

            if kind in ID_REFERENCING_PROPERTIES_BY_KIND_OF_POSSESSOR:
                missing_key_error_pcolls.extend(
                    models_of_kind | GetMissingModelKeyErrors(kind))

        existing_key_counts = (
            existing_key_count_pcolls
            | 'Flatten PCollections of existing key counts' >> beam.Flatten()
        )
        missing_key_errors = (
            missing_key_error_pcolls
            | 'Flatten PCollections of missing key errors' >> beam.Flatten()
        )
        audit_error_pcolls.append(
            (existing_key_counts, missing_key_errors)
            | 'Group counts and errors by key' >> beam.CoGroupByKey()
            | 'Filter keys without any errors' >> (
                beam.FlatMapTuple(self._get_model_relationship_errors))
        )

        return audit_error_pcolls | 'Combine audit results' >> beam.Flatten()

    def _get_model_relationship_errors(
            self, unused_join_key, counts_and_errors):
        """Returns errors associated with the given model key if it's missing.

        Args:
            unused_join_key: ModelKey. The key the counts and errors were joined
                by.
            counts_and_errors: tuple(list(int), list(ModelRelationshipError)).
                The join results. The first element is a list of counts
                corresponding to the number of keys discovered in the datastore.
                The second element is the list of errors that should be reported
                when their sum is 0.

        Returns:
            list(ModelRelationshipError). A list of errors for the given key.
            Only non-empty when the sum of counts is 0.
        """
        counts, errors = counts_and_errors
        return errors if sum(counts) == 0 else []


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

        This is the method that PTransform requires us to override when
        implementing custom transforms.

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


class GetExistingModelKeyCounts(beam.PTransform):
    """Returns PCollection of (key, count) pairs for each input model."""

    def __init__(self, kind):
        """Initializes the PTransform.

        Args:
            kind: str. The kind of model this PTransform will receive.
        """
        super(GetExistingModelKeyCounts, self).__init__(
            label='Generate (key, count)s for all existing %ss' % kind)
        self._kind = kind

    def expand(self, models_of_kind):
        """Returns a PCollection of (key, count) pairs for each input model.

        Args:
            models_of_kind: PCollection. The input models.

        Returns:
            PCollection. The (ModelKey, int) pairs correponding to the input
            models and their counts (always 1).
        """
        return (
            models_of_kind
            | 'Generate (key, count) for %ss' % self._kind >> beam.Map(
                lambda model: (ModelKey.from_model(model), 1))
        )


class GetMissingModelKeyErrors(beam.PTransform):
    """Returns PCollection of (key, error) pairs for each referenced model."""

    def __init__(self, kind):
        """Initializes the PTransform.

        Args:
            kind: str. The kind of model this PTransform will receive.
        """
        super(GetMissingModelKeyErrors, self).__init__(
            label='Generate (key, error)s from the ID properties in %s' % kind)
        self._id_referencing_properties = (
            ID_REFERENCING_PROPERTIES_BY_KIND_OF_POSSESSOR[kind])

    def expand(self, models_of_kind):
        """Returns PCollections of (key, error) pairs referenced by the models.

        Args:
            models_of_kind: PCollection. The input models.

        Returns:
            iterable(PCollection). The (ModelKey, ModelRelationshipError) pairs
            corresponding to the models referenced by the ID properties on the
            input models, and the error that should be reported when they are
            missing.
        """
        return (
            models_of_kind
            | 'Generate errors from %s' % property_of_model >> beam.FlatMap(
                self._generate_missing_key_errors, property_of_model,
                referenced_kinds)

            for property_of_model, referenced_kinds in
            self._id_referencing_properties
        )

    def _generate_missing_key_errors(
            self, model, property_of_model, referenced_kinds):
        """Yields all model keys referenced by the given model's properties.

        Args:
            model: Model. The input model.
            property_of_model: ModelProperty. The property that holds the ID(s)
                of referenced model(s).
            referenced_kinds: tuple(str). The kinds of models that the property
                refers to.

        Yields:
            tuple(ModelKey, ModelRelationshipError). The key for a referenced
            model and the error to report when the key doesn't exist.
        """
        # NOTE: This loop yields 1 or many values, depending on whether the
        # property is a repeated property (i.e. a list).
        for property_value in property_of_model.yield_value_from_model(model):
            if property_value is None:
                continue
            model_id = job_utils.get_model_id(model)
            referenced_id = python_utils.convert_to_bytes(property_value)
            for referenced_kind in referenced_kinds:
                error = base_validation_errors.ModelRelationshipError(
                    property_of_model, model_id, referenced_kind, referenced_id)
                yield (ModelKey(referenced_kind, referenced_id), error)
