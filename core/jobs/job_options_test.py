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

from __future__ import annotations

from core.jobs import job_options
from core.tests import test_utils


class JobOptionsTests(test_utils.TestBase):

    def test_default_values(self) -> None:
        options = job_options.JobOptions()

        self.assertIsNone(options.namespace)

    def test_overwritten_values(self) -> None:
        options = job_options.JobOptions(namespace='abc')

        self.assertEqual(options.namespace, 'abc')

    def test_unsupported_values(self) -> None:
        with self.assertRaisesRegex(ValueError, r'Unsupported option\(s\)'):
            job_options.JobOptions(a='a', b='b')
