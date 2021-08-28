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

from __future__ import absolute_import
from __future__ import unicode_literals

import re

from core.tests import test_utils
from jobs import base_jobs
from jobs import job_test_utils


class MockJobMetaclass(base_jobs.JobMetaclass):
    """Subclass of JobMetaclass to avoid interacting with the real registry."""

    _JOB_REGISTRY = {}

    @classmethod
    def clear(cls):
        """Clears the registry of jobs."""
        cls._JOB_REGISTRY.clear()


class JobMetaclassTests(test_utils.TestBase):

    def tearDown(self):
        MockJobMetaclass.clear()
        super(JobMetaclassTests, self).tearDown()

    def test_does_not_put_base_classes_in_registry(self):
        class FooJobBase(metaclass=MockJobMetaclass): # pylint: disable=unused-variable
            """Job class with name that ends with 'Base'."""

            def __init__(self):
                pass

        self.assertEqual(MockJobMetaclass.get_all_jobs(), [])
        self.assertEqual(MockJobMetaclass.get_all_job_names(), [])
        self.assertRaisesRegexp(
            ValueError, 'FooJobBase is not registered as a job',
            lambda: MockJobMetaclass.get_job_class_by_name('FooJobBase'))

    def test_puts_non_base_classes_in_registry(self):
        class FooJob(metaclass=MockJobMetaclass):
            """Job class that does nothing."""

            def __init__(self):
                pass

        self.assertEqual(MockJobMetaclass.get_all_jobs(), [FooJob])
        self.assertEqual(MockJobMetaclass.get_all_job_names(), ['FooJob'])
        self.assertIs(MockJobMetaclass.get_job_class_by_name('FooJob'), FooJob)

    def test_raises_type_error_for_jobs_with_duplicate_names(self):
        class FooJob(metaclass=MockJobMetaclass):
            """Job class that does nothing."""

            def __init__(self):
                pass

        # NOTE: Deletes the variable, not the class.
        del FooJob

        with self.assertRaisesRegexp(TypeError, 'name is already used'):
            class FooJob(metaclass=MockJobMetaclass): # pylint: disable=function-redefined
                """Job class with duplicate name."""

                def __init__(self):
                    pass


class JobBaseTests(job_test_utils.PipelinedTestBase):

    def test_run_raises_not_implemented_error(self):
        self.assertRaisesRegexp(
            NotImplementedError,
            re.escape('Subclasses must implement the run() method'),
            base_jobs.JobBase(self.pipeline).run)
