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

"""Unit tests for jobs.base_validation_jobs."""

from __future__ import annotations

import datetime

from core.jobs import job_test_utils
from core.jobs.batch_jobs.datastore_audit import base_validation_jobs
from core.jobs.types import base_validation_errors
from core.jobs.types import job_run_result
from core.platform import models

from typing import Callable, Iterator, List, Type

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import base_models

(base_models,) = models.Registry.import_models([models.Names.BASE_MODEL])


class MissingGetValidationFnsJob(base_validation_jobs.BaseValidationJob):
    """Child validation job with missing get_validation_fns."""

    def validate_domain_object(
        self, unused_model: base_models.BaseModel) -> Iterator[
            job_run_result.JobRunResult]:
        """Mock domain validate function."""
        # The yield from () statement is used to ensure that the function
        # returns an empty iterator every time it's called.
        # The following other approaches won't work:
        # - Using pass: The function would implicitly return None. Attempting to
        # iterate over None in the calling code results in a
        # TypeError: 'NoneType' object is not iterable.
        # - Using yield: The function would yield None. Subsequent processing
        # steps in the validation pipeline would then try to access attributes
        # of this None value (expecting a validation error object),
        # leading to an AttributeError.
        yield from ()

    def get_validate_domain_object_fn(self) -> Callable[
            [base_models.BaseModel],
            Iterator[job_run_result.JobRunResult]
        ]:
        return self.validate_domain_object


class MissingGetValidateDomainObjectFnJob(
    base_validation_jobs.BaseValidationJob):
    """Child validation job with missing get_validate_domain_object_fn."""

    def validate_mock_error(
            self, unused_model: base_models.BaseModel
        ) -> Iterator[base_validation_errors.BaseValidationError]:
        """Mock validation function."""
        # The yield from () statement is used to ensure that the function
        # returns an empty iterator every time it's called.
        # The following other approaches won't work:
        # - Using pass: The function would implicitly return None. Attempting to
        # iterate over None in the calling code results in a
        # TypeError: 'NoneType' object is not iterable.
        # - Using yield: The function would yield None. Subsequent processing
        # steps in the validation pipeline would then try to access attributes
        # of this None value (expecting a validation error object),
        # leading to an AttributeError.
        yield from ()

    def get_validation_fns(self) -> List[
        Callable[
            [base_models.BaseModel],
            Iterator[job_run_result.JobRunResult]
        ]]:
        return [self.validate_mock_error]


class MockDomainObjectValidationError(
    base_validation_errors.BaseValidationError):
    """Error class for models with inconsistent timestamps."""

    pass


class MockChildValidationJob(base_validation_jobs.BaseValidationJob):
    """Child validation job with a mock validation function."""

    def get_validation_fns(self) -> List[
        Callable[
            [base_models.BaseModel],
            Iterator[job_run_result.JobRunResult]
        ]]:
        return [self.validate_mock_error]

    def validate_mock_error(self, model: base_models.BaseModel) -> Iterator[
        base_validation_errors.BaseValidationError]:
        """Mock validation function."""
        if 'mock_error' in model.id:
            yield base_validation_errors.BaseValidationError(
                message='Mock validation error message', model=model
            )

    def validate_domain_object(
        self, unused_model: base_models.BaseModel) -> Iterator[
            job_run_result.JobRunResult]:
        """Mock domain validate function."""
        # The yield from () statement is used to ensure that the function
        # returns an empty iterator every time it's called.
        # The following other approaches won't work:
        # - Using pass: The function would implicitly return None. Attempting to
        # iterate over None in the calling code results in a
        # TypeError: 'NoneType' object is not iterable.
        # - Using yield: The function would yield None. Subsequent processing
        # steps in the validation pipeline would then try to access attributes
        # of this None value (expecting a validation error object),
        # leading to an AttributeError.
        yield from ()

    def get_validate_domain_object_fn(self) -> Callable[
            [base_models.BaseModel],
            Iterator[job_run_result.JobRunResult]
        ]:
        return self.validate_domain_object


class BaseValidationJobTests(job_test_utils.JobTestBase):

    JOB_CLASS: Type[base_validation_jobs.BaseValidationJob] = (
        MockChildValidationJob)

    def test_run_with_datetime_error(self) -> None:
        now = datetime.datetime.now()

        model = self.create_model(
            base_models.BaseModel,
            id='model_with_timestamp_error',
            created_on=now + datetime.timedelta(days=1),
            last_updated=now
        )
        self.put_multi([model])

        self.assert_job_output_is(
            [
                {
                    'InconsistentTimestampsError': [
                        base_validation_errors.InconsistentTimestampsError(
                            model).stderr
                    ],
                }
            ]
        )

    def test_run_with_mock_validation_error(self) -> None:
        model = self.create_model(
            base_models.BaseModel,
            id='model_with_mock_error'
        )

        self.put_multi([model])

        self.assert_job_output_is(
            [
                {
                    'BaseValidationError': [
                       base_validation_errors.BaseValidationError(
                           'Mock validation error message', model
                       ).stderr
                    ]
                }
            ]
        )

    def test_run_with_valid_model(self) -> None:
        model = self.create_model(
            base_models.BaseModel,
            id='valid_model'
        )

        self.put_multi([model])

        self.assert_job_output_is([])

    def test_truncation_of_messages(self) -> None:
        model1 = self.create_model(
            base_models.BaseModel,
            id='model_with_mock_error_1'
        )
        model2 = self.create_model(
            base_models.BaseModel,
            id='model_with_mock_error_2'
        )
        model3 = self.create_model(
            base_models.BaseModel,
            id='model_with_mock_error_3'
        )

        self.put_multi([model1, model2, model3])

        with self.swap(base_validation_jobs, 'ERROR_TRUNCATION_LIMIT', 2):
            self.assert_job_output_is(
                [
                    {
                        'BaseValidationError': [
                            base_validation_errors.BaseValidationError(
                                'Mock validation error message', model1
                            ).stderr,
                            base_validation_errors.BaseValidationError(
                                'Mock validation error message', model2
                            ).stderr
                        ]
                    }
                ]
            )

    def test_get_validation_fns_not_implemented(self) -> None:
        self.job = MissingGetValidationFnsJob(self.pipeline)

        with self.assertRaisesRegex(
            NotImplementedError,
            'Missing implementation for get_validation_fns in derived class.'):
            self.run_job()

    def test_validate_domain_object_not_implemented(self) -> None:
        self.job = MissingGetValidateDomainObjectFnJob(self.pipeline)

        with self.assertRaisesRegex(
            NotImplementedError,
            'Missing implementation for get_validate_domain_object_fn '
            'in derived class.'):
            self.run_job()
