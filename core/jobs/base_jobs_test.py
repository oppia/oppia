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

"""Unit tests for jobs.base_jobs."""

from __future__ import annotations

import re

from core.jobs import base_jobs
from core.jobs import job_test_utils
from core.tests import test_utils

from typing import Dict, Type


class MockJobMetaclass(base_jobs.JobMetaclass):
    """Subclass of JobMetaclass to avoid interacting with the real registry."""

    _JOB_REGISTRY: Dict[str, Type[base_jobs.JobBase]] = {}

    @classmethod
    def clear(mcs) -> None:
        """Clears the registry of jobs."""
        mcs._JOB_REGISTRY.clear()


class JobMetaclassTests(test_utils.TestBase):

    def tearDown(self) -> None:
        MockJobMetaclass.clear()
        super().tearDown()

    def test_does_not_put_base_classes_in_registry(self) -> None:
        class FooJobBase(base_jobs.JobBase, metaclass=MockJobMetaclass): # pylint: disable=unused-variable
            """Job class with name that ends with 'Base'."""

            pass

        self.assertEqual(MockJobMetaclass.get_all_jobs(), [])
        self.assertEqual(MockJobMetaclass.get_all_job_names(), [])
        with self.assertRaisesRegex(
            ValueError, 'FooJobBase is not registered as a job'
        ):
            MockJobMetaclass.get_job_class_by_name('FooJobBase')

    def test_puts_non_base_classes_in_registry(self) -> None:
        class FooJob(base_jobs.JobBase, metaclass=MockJobMetaclass):
            """Job class that does nothing."""

            pass

        self.assertEqual(MockJobMetaclass.get_all_jobs(), [FooJob])
        self.assertEqual(MockJobMetaclass.get_all_job_names(), ['FooJob'])
        self.assertIs(MockJobMetaclass.get_job_class_by_name('FooJob'), FooJob)

    def test_raises_type_error_for_jobs_with_duplicate_names(self) -> None:
        # NOTE: Creates a 'FooJob' programmatically.
        MockJobMetaclass('FooJob', (base_jobs.JobBase,), {})

        with self.assertRaisesRegex(TypeError, 'name is already used'):
            class FooJob(base_jobs.JobBase, metaclass=MockJobMetaclass): # pylint: disable=unused-variable
                """Job class with duplicate name."""

                pass

    def test_raises_type_error_if_job_base_not_subclassed(self) -> None:
        with self.assertRaisesRegex(TypeError, 'must inherit from JobBase'):
            class FooJob(metaclass=MockJobMetaclass): # pylint: disable=unused-variable
                """Job class that does not inherit from JobBase."""

                def __init__(self) -> None:
                    pass

    def test_raises_type_error_if_job_name_not_suffixed_with_job(self) -> None:
        with self.assertRaisesRegex(TypeError, 'must end with "Job"'):
            class FooBar(base_jobs.JobBase, metaclass=MockJobMetaclass): # pylint: disable=unused-variable
                """Job class that does not have a name ending with "Job"."""

                pass


class JobBaseTests(job_test_utils.PipelinedTestBase):

    def test_run_raises_not_implemented_error(self) -> None:
        with self.assertRaisesRegex(
            NotImplementedError,
            re.escape('Subclasses must implement the run() method')
        ):
            base_jobs.JobBase(self.pipeline).run()
