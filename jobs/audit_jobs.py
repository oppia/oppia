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

import itertools

from jobs import base_jobs
from jobs import job_utils
from jobs.transforms import audits_registry
from jobs.transforms import base_model_audits
from jobs.types import audit_errors
import python_utils

import apache_beam as beam

AUDIT_DO_FN_TYPES_BY_KIND = audits_registry.get_audit_do_fn_types_by_kind()
KIND_BY_INDEX = tuple(AUDIT_DO_FN_TYPES_BY_KIND.keys())

PROP_REFERENCES_BY_KIND = audits_registry.get_property_relationships_by_kind()
KINDS_REFERENCED_BY_PROPS = tuple(itertools.chain.from_iterable(
    itertools.chain.from_iterable(referenced_kinds_by_prop_name.values())
    for referenced_kinds_by_prop_name in PROP_REFERENCES_BY_KIND.values()))


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

        existing_key_pcolls = []
        errors_by_expected_key_pcolls = []
        audit_error_pcolls = [
            deleted_models
            | 'Apply ValidateDeletedModel on deleted models' >> (
                beam.ParDo(base_model_audits.ValidateDeletedModel()))
        ]

        model_groups = python_utils.ZIP(KIND_BY_INDEX, models_of_kind_by_index)
        for kind, models_of_kind in model_groups:
            audit_error_pcolls.extend(models_of_kind | ApplyAuditDoFns(kind))

            if kind in KINDS_REFERENCED_BY_PROPS:
                existing_key_pcolls.append(
                    models_of_kind | GetExistingModelKeys(kind))

            if kind in PROP_REFERENCES_BY_KIND:
                errors_by_expected_key_pcolls.extend(
                    models_of_kind | GetErrorsByExpectedModelKey(kind))

        counts_by_existing_key = (
            existing_key_pcolls
            | 'Flatten PCollections of actual keys' >> beam.Flatten()
        )
        errors_by_expected_key = (
            errors_by_expected_key_pcolls
            | 'Flatten PCollections of expected keys' >> beam.Flatten()
        )
        audit_error_pcolls.append(
            (counts_by_existing_key, errors_by_expected_key)
            | 'Group counts and errors by key' >> beam.CoGroupByKey()
            | 'Filter keys without any errors' >> beam.FlatMapTuple(
                self._get_model_relationship_errors)
        )

        return audit_error_pcolls | 'Combine audit results' >> beam.Flatten()

    def _get_model_relationship_errors(self, unused_key, counts_and_errors):
        """Returns errors associated with the given model key.

        Args:
            unused_key: tuple(str, str). A (model kind, model id) pair.
            counts_and_errors: tuple(list(int), list(*)). A pair of details
                corresponding to the key. The first element is the count of keys
                discovered in the datastore. The second element is a list of
                errors that should be raised if the count is 0.

        Returns:
            list(*). A list of errors for the given key. If the model exists
            (sum(counts) > 0), then the errors will always be empty.
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


class GetExistingModelKeys(beam.PTransform):
    """Returns PCollection of (key, count) pairs for each input model."""

    def __init__(self, kind):
        """Initializes the PTransform.

        Args:
            kind: str. The kind of model this PTransform will receive.
        """
        super(GetExistingModelKeys, self).__init__(
            label='Generate keys for all existing %ss' % kind)
        self._kind = kind

    def expand(self, models_of_kind):
        """Returns a PCollection of (key, count) pairs for each input model.

        Args:
            models_of_kind: PCollection. The input models.

        Returns:
            PCollection. A (key, count) pair for each input model. The key is a
            tuple of (kind: str, ID: str), and the count is always be 1.
        """
        return (
            models_of_kind
            | 'Generate (key, count) for %ss' % self._kind >> beam.Map(
                lambda model: ((self._kind, job_utils.get_model_id(model)), 1))
        )


class GetErrorsByExpectedModelKey(beam.PTransform):
    """Returns PCollection of (key, error) pairs for each referenced model."""

    def __init__(self, kind):
        """Initializes the PTransform.

        Args:
            kind: str. The kind of model this PTransform will receive.
        """
        super(GetErrorsByExpectedModelKey, self).__init__(
            label='Generate (key, error)s for models that %s depends on' % kind)
        self._kind = kind
        self._prop_references = tuple(PROP_REFERENCES_BY_KIND[kind].items())

    def expand(self, models_of_kind):
        """Returns PCollection of (key, error) pairs for each referenced model.

        Args:
            models_of_kind: PCollection. The models to inspect for property
                references.

        Yields:
            PCollection. The (key, ModelRelationshipError) pairs of all models
            referenced by a specific property on the input models. The key is a
            (kind: str, ID: str) pair.
        """
        for prop_name, referenced_kinds in self._prop_references:
            yield (
                models_of_kind
                | 'Generate errors from %s.%s' % (self._kind, prop_name) >> (
                    beam.FlatMap(
                        self._generate_expected_model_errors, prop_name,
                        referenced_kinds))
            )

    def _generate_expected_model_errors(
            self, model, prop_name, referenced_kinds):
        """Yields all model keys referenced by the given model's properties.

        Args:
            model: Model. An individual input model.
            prop_name: str. The property that holds the ID of another model.
            referenced_kinds: tuple(str). The kinds of models that are expected
                to correspond to the ID.

        Yields:
            tuple(tuple(str, str), ModelRelationshipError). The key for a
            referenced model (kind: str, ID: str), and the error that should be
            reported if the key does not exist.
        """
        prop_value = job_utils.get_model_property(model, prop_name)
        if prop_value is None:
            return
        model_id, referenced_id = (
            job_utils.get_model_id(model),
            # IDs need to be in bytes to compare equal to an actual model's ID.
            python_utils.convert_to_bytes(prop_value))
        for referenced_kind in referenced_kinds:
            error = audit_errors.ModelRelationshipError(
                self._kind, model_id, prop_name, referenced_kind, referenced_id)
            yield ((referenced_kind, referenced_id), error)
