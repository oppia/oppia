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

"""Unit tests for jobs.job_options."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import re

from core.tests import test_utils
from jobs import job_options
from jobs.io import stub_io


class JobOptionsTests(test_utils.TestBase):

    def test_default_values(self):
        options = job_options.JobOptions()

        self.assertIsNone(options.datastoreio)

    def test_overwritten_values(self):
        datastoreio_stub = stub_io.DatastoreioStub()

        options = job_options.JobOptions(datastoreio=datastoreio_stub)

        self.assertIs(options.datastoreio, datastoreio_stub)

    def test_unsupported_values(self):
        self.assertRaisesRegexp(
            ValueError, re.escape('Unsupported option(s): a, b'),
            lambda: job_options.JobOptions(a=1, b=2))
