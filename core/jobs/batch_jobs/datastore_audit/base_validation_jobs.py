# coding: utf-8
#
# Copyright 2025 The Oppia Authors. All Rights Reserved.
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

"""Validation Jobs for base models"""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms.validation import base_validation
from core.jobs.types import base_validation_errors, job_run_result
from core.platform import models

import apache_beam as beam
from typing import Callable, Dict, Iterator, List

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import base_models, datastore_services

(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])

datastore_services = models.Registry.import_datastore_services()

ERROR_TRUNCATION_LIMIT = 10

"""Validation Jobs for base models

# How to write validation jobs:

For every group of data models defined within 'core/storage/<X>/gae_models.py',
there should be a corresponding validation job file named 'X_jobs.py' located
within the `datastore_audit` directory. This file should contain a validation
job for each of the models defined in the corresponding `gae_models.py`.

The naming convention for the validation job classes within 'x_jobs.py'
should be `<StorageModelName>ValidationJob`.

This class must implement the following methods:

- `get_validation_fns(self):
  This method should return a list of functions. Each function takes a model
  instance as input and yields `JobRunResult` objects for any validation
  errors found.

- `get_validate_domain_object_fn(self):
  This method should return a function that takes a model instance and
  validates its corresponding domain object. It should yield
  `JobRunResult` objects for any validation errors found in the domain object.
"""


# TODO(oppia-web-developer-docs#464): Create wiki page for pointers on writing
# validation jobs.
class BaseValidationJob(base_jobs.JobBase):
    """Base class for all validation jobs."""

    def run(self) -> beam.PCollection[Dict[str, List[str]]]:
        """Runs the validation job.

        Returns:
            PCollection. A PCollection of dictionaries, where keys are error
            types and values are lists of truncated model IDs.
        """
        all_models = (
            self.pipeline
            | 'Get all models' >> (
                ndb_io.GetModels(datastore_services.query_everything()))
        )

        default_validation_fns = [
            self.validate_created_on_less_than_last_updated,
            self.get_validate_domain_object_fn(),
        ]
        all_validation_fns = default_validation_fns + self.get_validation_fns()
        results = all_models | 'Apply Validations' >> beam.ParDo(
            ApplyAllValidations(all_validation_fns)
        )

        # Group errors by type and truncate number of messages.
        # This is important for the following reasons:
        # 1) To improve readability: it makes the error reports more organized
        # and easier to understand by grouping similar errors together.
        # 2) For efficient analysis: Grouping allows for easier analysis and
        # troubleshooting. You can quickly identify the different groups of
        # errors and focus on addressing each group.
        # 3) To prevent truncation issues: Grouping errors by type helps prevent
        # situations where certain error types are hidden due to truncation
        # limits in logging systems. By grouping, we can ensure that a
        # representative sample of each error type is visible in the initial
        # set of logs, even if the total number of errors for a particular
        # type exceeds the truncation limit.
        return results | 'Group Errors by Type' >> beam.GroupBy(
            lambda error: type(error).__name__
        ) | 'Extract Error Messages' >> beam.Map(
            lambda group: {
                group[0]: sorted([error.stderr for error in group[1]])[
                    :ERROR_TRUNCATION_LIMIT]
            }
        )

    def get_validation_fns(self) -> List[
        Callable[
            [base_models.BaseModel],
            Iterator[job_run_result.JobRunResult]
        ]]:
        """Provides a list of validation functions to be applied on a model.
        Should be implemented in the inherited classes.

        Raises:
            NotImplementedError. The method is not overwritten in derived
                classes.
        """
        raise NotImplementedError(
            'Missing implementation for get_validation_fns '
            'in derived class.'
        )

    def validate_created_on_less_than_last_updated(
        self, model: base_models.BaseModel) -> Iterator[
            job_run_result.JobRunResult]:
        """Validates that the model's created_on time is less than or equal to
        its last_updated time.

        Args:
            model: datastore_services.Model. The model to validate.

        Yields:
            JobRunResult. The result of the validation (if any error is found).
        """
        if model.created_on > (
            model.last_updated + base_validation.MAX_CLOCK_SKEW_DURATION):
            yield base_validation_errors.InconsistentTimestampsError(model)

    def get_validate_domain_object_fn(self) -> Callable[
            [base_models.BaseModel],
            Iterator[job_run_result.JobRunResult]
        ]:
        """Provides a function to validate domain object for the
        corresponding model. Should be implemented in the inherited classes.

        Raises:
            NotImplementedError. The method is not overwritten in derived
                classes.
        """
        raise NotImplementedError(
            'Missing implementation for get_validate_domain_object_fn '
            'in derived class.'
        )


# TODO(#15613): Here we use MyPy ignore because the incomplete typing of
# apache_beam library and absences of stubs in Typeshed, forces MyPy to
# assume that DoFn class is of type Any. Thus to avoid MyPy's error (Class
# cannot subclass 'DoFn' (has type 'Any')), we added an ignore here.
class ApplyAllValidations(beam.DoFn):  # type: ignore[misc]
    """A PTransform to apply all validation functions to a single model."""

    def __init__(
        self, validation_functions: List[
            Callable[
                [base_models.BaseModel],
                Iterator[job_run_result.JobRunResult]
            ]]
        ):
        super().__init__()
        self._validation_functions = validation_functions

    def process(self, model: base_models.BaseModel) -> Iterator[
        job_run_result.JobRunResult]:
        for validation_fn in self._validation_functions:
            for error in validation_fn(model):
                yield error
