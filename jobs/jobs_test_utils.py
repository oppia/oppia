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

"""Base test class for Apache Beam jobs."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.tests import test_utils

from apache_beam.runners.direct import direct_runner
from apache_beam.testing import test_pipeline
from apache_beam.testing import util as beam_testing_util


class BeamTestBase(test_utils.TestBase):
    """Base class that sets up a testing pipeline for subclasses to use."""

    def __init__(self, *args, **kwargs):
        super(BeamTestBase, self).__init__(*args, **kwargs)
        self.pipeline = None

    def run(self, result=None):
        """Run the test within the context of a test pipeline.

        https://docs.python.org/3/library/unittest.html#unittest.TestCase.run

        Args:
            result: TestResult | None. Holds onto the results of each test. If
                None, a temporary result object is created (by calling the
                defaultTestResult() method) and used instead.
        """
        runner = direct_runner.DirectRunner()
        with test_pipeline.TestPipeline(runner=runner) as p:
            self.pipeline = p
            super(BeamTestBase, self).run(result=result)

    def assert_pcoll_equal(self, actual, expected):
        """Asserts that the given PCollections are equal."""
        return beam_testing_util.assert_that(
            actual, beam_testing_util.equal_to(expected))
