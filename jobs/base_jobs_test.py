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

import contextlib

from core.tests import test_utils
from jobs import base_jobs
from jobs import job_options
import python_utils

import apache_beam as beam
from apache_beam import runners
from apache_beam.options import pipeline_options
from apache_beam.testing import test_pipeline


class MockJobMetaclass(base_jobs.JobMetaclass):
    """Subclass of JobMetaclass to avoid interacting with the real registry."""

    _JOB_REGISTRY = []

    @classmethod
    def clear(mcs):
        """Clears the registry of jobs."""
        del mcs._JOB_REGISTRY[:]


class JobMetaclassTests(test_utils.TestBase):

    def tearDown(self):
        MockJobMetaclass.clear()
        super(JobMetaclassTests, self).tearDown()

    def test_raises_type_error_if_class_is_missing_run_method(self):
        with self.assertRaisesRegexp(TypeError, r'must define run\(\) method'):
            class JobWithoutRun(python_utils.with_metaclass(MockJobMetaclass)): # pylint: disable=unused-variable
                """Did not implement run() method."""

                def __init__(self):
                    pass

        self.assertEqual(MockJobMetaclass.get_jobs(), [])

    def test_does_not_put_base_classes_in_registry(self):
        class FooJobBase(python_utils.with_metaclass(MockJobMetaclass)): # pylint: disable=unused-variable
            """Job class with name that ends with 'Base'."""

            def __init__(self):
                pass

            def run(self):
                """Does nothing."""
                pass

        self.assertEqual(MockJobMetaclass.get_jobs(), [])

    def test_puts_non_base_classes_in_registry(self):
        class FooJob(python_utils.with_metaclass(MockJobMetaclass)):
            """Job class that does nothing."""

            def __init__(self):
                pass

            def run(self):
                """Does nothing."""
                pass

        self.assertEqual(MockJobMetaclass.get_jobs(), [FooJob])

    def test_run_enters_pipeline_context(self):
        call_counter = test_utils.CallCounter(lambda: None)

        @contextlib.contextmanager
        def call_func_when_entered(func):
            """Calls func when entered."""
            func()
            try:
                yield
            finally:
                pass

        class FooJob(python_utils.with_metaclass(MockJobMetaclass)):
            """Job that does nothing."""

            def __init__(self):
                self.pipeline = call_func_when_entered(call_counter)

            def run(self):
                """Does nothing."""
                pass

        foo_job = FooJob()

        self.assertEqual(call_counter.times_called, 0)

        foo_job.run()

        self.assertEqual(call_counter.times_called, 1)


class JobBaseTests(test_utils.TestBase):

    def test_default_config(self):
        job = base_jobs.JobBase()

        self.assertIsInstance(job.pipeline, beam.Pipeline)
        self.assertIsInstance(job.pipeline.runner, runners.DataflowRunner)
        self.assertIsInstance(job.pipeline.options, job_options.JobOptions)

    def test_explicit_config(self):
        pipeline = test_pipeline.TestPipeline
        runner = runners.DirectRunner()
        options = pipeline_options.TestOptions()

        job = base_jobs.JobBase(
            pipeline=pipeline, runner=runner, options=options)

        self.assertIsInstance(job.pipeline, test_pipeline.TestPipeline)
        self.assertIsInstance(job.pipeline.runner, runners.DirectRunner)
        self.assertIsInstance(
            job.pipeline.options, pipeline_options.TestOptions)

    def test_run_raises_not_implemented_error(self):
        pipeline = test_pipeline.TestPipeline
        runner = runners.DirectRunner()
        job = base_jobs.JobBase(pipeline=pipeline, runner=runner)

        self.assertRaisesRegexp(
            NotImplementedError, r'must implement the run\(\) method', job.run)
