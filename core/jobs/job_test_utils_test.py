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

"""Unit tests for jobs.job_test_utils."""

from __future__ import annotations

from unittest import mock

from core.jobs import job_test_utils
from core.platform import models
from core.tests import test_utils

import apache_beam as beam
from apache_beam.testing import util as beam_testing_util

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import base_models

(base_models,) = models.Registry.import_models([models.NAMES.base_model])


class PipelinedTestBaseTests(job_test_utils.PipelinedTestBase):

    def test_assert_pcoll_empty_raises_immediately(self) -> None:
        # NOTE: Arbitrary operations that produce a non-empty PCollection.
        output = self.pipeline | beam.Create([123]) | beam.Map(lambda x: x)
        with self.assertRaisesRegex(AssertionError, 'failed'): # type: ignore[no-untyped-call]
            self.assert_pcoll_empty(output)

    def test_assert_pcoll_equal_raises_immediately(self) -> None:
        # NOTE: Arbitrary operations that produce an empty PCollection.
        output = self.pipeline | beam.Create([]) | beam.Map(lambda x: x)

        with self.assertRaisesRegex(AssertionError, 'failed'): # type: ignore[no-untyped-call]
            self.assert_pcoll_equal(output, [123])

    def test_assert_pcoll_empty_raises_runtime_error_when_called_twice(
        self
    ) -> None:
        # NOTE: Arbitrary operations that produce a non-empty PCollection.
        output = self.pipeline | beam.Create([]) | beam.Map(lambda x: x)

        self.assert_pcoll_empty(output)

        self.assertRaisesRegex( # type: ignore[no-untyped-call]
            RuntimeError, 'must be run in the pipeline context',
            lambda: self.assert_pcoll_empty(output))

    def test_assert_pcoll_equal_raises_runtime_error_when_called_twice(
        self
    ) -> None:
        # NOTE: Arbitrary operations that produce a non-empty PCollection.
        output = self.pipeline | beam.Create([123]) | beam.Map(lambda x: x)

        self.assert_pcoll_equal(output, [123])

        self.assertRaisesRegex( # type: ignore[no-untyped-call]
            RuntimeError, 'must be run in the pipeline context',
            lambda: self.assert_pcoll_equal(output, [123]))

    def test_create_model_sets_date_properties(self) -> None:
        model = self.create_model(base_models.BaseModel)

        self.assertEqual(model.created_on, self.YEAR_AGO)
        self.assertEqual(model.last_updated, self.YEAR_AGO)


class JobTestBaseTests(job_test_utils.JobTestBase):

    JOB_CLASS = mock.Mock()

    def tearDown(self) -> None:
        self.JOB_CLASS.reset_mock()
        super().tearDown()

    def test_run_job(self) -> None:
        self.run_job()

        self.job.run.assert_called() # type: ignore[attr-defined]

    def test_job_output_is(self) -> None:
        self.job.run.return_value = ( # type: ignore[attr-defined]
            # NOTE: Arbitrary operations that produce a non-empty PCollection.
            self.pipeline | beam.Create([123]) | beam.Map(lambda x: x))

        self.assert_job_output_is([123])

    def test_job_output_is_empty(self) -> None:
        self.job.run.return_value = ( # type: ignore[attr-defined]
            # NOTE: Arbitrary operations that produce an empty PCollection.
            self.pipeline | beam.Create([]) | beam.Map(lambda x: x))

        self.assert_job_output_is_empty()


class DecorateBeamErrorsTests(test_utils.TestBase):

    def assert_error_is_decorated(
        self, actual_msg: str, decorated_msg: str
    ) -> None:
        """Asserts that decorate_beam_errors() raises with the right message.

        Args:
            actual_msg: str. The actual message raised originally.
            decorated_msg: str. The expected decorated message produced by the
                context manager.
        """
        try:
            with job_test_utils.decorate_beam_errors():
                raise beam_testing_util.BeamAssertException(actual_msg)
        except AssertionError as e:
            self.assertMultiLineEqual(str(e), decorated_msg)

    def test_decorates_message_with_both_unexpected_and_missing(self) -> None:
        actual_msg = (
            'Error, unexpected elements ["abc", "def"], '
            'missing elements ["123", "456"] [while running FooJob]')
        decorated_msg = (
            'failed while running FooJob\n'
            '\n'
            'Unexpected:\n'
            '    \'abc\'\n'
            '    \'def\'\n'
            '\n'
            'Missing:\n'
            '    \'123\'\n'
            '    \'456\'\n'
        )

        self.assert_error_is_decorated(actual_msg, decorated_msg)

    def test_decorates_message_with_only_unexpected(self) -> None:
        actual_msg = (
            'Error, unexpected elements ["abc", "def"] [while running FooJob]')
        decorated_msg = (
            'failed while running FooJob\n'
            '\n'
            'Unexpected:\n'
            '    \'abc\'\n'
            '    \'def\'\n'
        )

        self.assert_error_is_decorated(actual_msg, decorated_msg)

    def test_decorates_message_with_only_missing(self) -> None:
        actual_msg = (
            'Error, missing elements ["abc", "def"] [while running FooJob]')
        decorated_msg = (
            'failed while running FooJob\n'
            '\n'
            'Missing:\n'
            '    \'abc\'\n'
            '    \'def\'\n'
        )

        self.assert_error_is_decorated(actual_msg, decorated_msg)

    def test_decorates_message_with_comparison_to_empty_list(self) -> None:
        actual_msg = (
            'Error [] == ["abc", "def"] [while running FooJob]')
        decorated_msg = (
            'failed while running FooJob\n'
            '\n'
            'Unexpected:\n'
            '    \'abc\'\n'
            '    \'def\'\n'
        )

        self.assert_error_is_decorated(actual_msg, decorated_msg)

    def test_does_not_decorate_message_without_element_info(self) -> None:
        actual_msg = 'Error something went wrong [while running FooJob]'

        self.assert_error_is_decorated(actual_msg, actual_msg)

    def test_does_not_decorate_message_with_invalid_unexpected_value(
        self
    ) -> None:
        actual_msg = (
            'Error, unexpected elements [abc, def] [while running FooJob]')

        self.assert_error_is_decorated(actual_msg, actual_msg)

    def test_does_not_decorate_message_with_invalid_missing_value(self) -> None:
        actual_msg = 'Error, missing elements [abc, def] [while running FooJob]'

        self.assert_error_is_decorated(actual_msg, actual_msg)

    def test_does_not_decorate_message_with_non_beam_type(self) -> None:
        with self.assertRaisesRegex(Exception, 'Error coming through!'): # type: ignore[no-untyped-call]
            with job_test_utils.decorate_beam_errors():
                raise Exception('Error coming through!')
