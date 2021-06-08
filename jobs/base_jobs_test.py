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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import re

from core.tests import test_utils
from jobs import base_jobs
from jobs import job_test_utils
import python_utils


class MockJobMetaclass(base_jobs.JobMetaclass):
    """Subclass of JobMetaclass to avoid interacting with the real registry."""

    _JOB_REGISTRY = {}

    @classmethod
    def clear(mcs):
        """Clears the registry of jobs."""
        mcs._JOB_REGISTRY.clear()


class JobMetaclassTests(test_utils.TestBase):

    def tearDown(self):
        MockJobMetaclass.clear()
        super(JobMetaclassTests, self).tearDown()

    def test_does_not_put_base_classes_in_registry(self):
        class FooJobBase(python_utils.with_metaclass(MockJobMetaclass)): # pylint: disable=unused-variable
            """Job class with name that ends with 'Base'."""

            def __init__(self):
                pass

        self.assertEqual(MockJobMetaclass.get_all_jobs(), [])
        self.assertEqual(MockJobMetaclass.get_all_job_names(), [])

    def test_puts_non_base_classes_in_registry(self):
        class FooJob(python_utils.with_metaclass(MockJobMetaclass)):
            """Job class that does nothing."""

            def __init__(self):
                pass

        self.assertEqual(MockJobMetaclass.get_all_jobs(), [FooJob])
        self.assertEqual(MockJobMetaclass.get_all_job_names(), ['FooJob'])

    def test_raises_type_error_for_jobs_with_duplicate_names(self):
        class FooJob(python_utils.with_metaclass(MockJobMetaclass)):
            """Job class that does nothing."""

            def __init__(self):
                pass

        del FooJob # NOTE: Deletes the variable, not the class.

        with self.assertRaisesRegexp(TypeError, 'name is already used'):
            class FooJob(python_utils.with_metaclass(MockJobMetaclass)): # pylint: disable=function-redefined
                """Job class with duplicate name."""

                def __init__(self):
                    pass


class JobBaseTests(job_test_utils.PipelinedTestBase):

    def test_run_raises_not_implemented_error(self):
        self.assertRaisesRegexp(
            NotImplementedError,
            re.escape('Subclasses must implement the run() method'),
            base_jobs.JobBase(self.pipeline).run)
