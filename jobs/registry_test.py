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

"""Unit tests for jobs.registry."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.tests import test_utils
from jobs import base_jobs
from jobs import registry


class RegistryTests(test_utils.TestBase):

    def test_get_all_jobs_returns_value_from_job_metaclass(self):
        unique_obj = object()

        @classmethod
        def get_all_jobs_mock(unused_cls):
            """Returns the unique_obj."""
            return unique_obj

        get_all_jobs_swap = self.swap(
            base_jobs.JobMetaclass, 'get_all_jobs', get_all_jobs_mock)

        with get_all_jobs_swap:
            self.assertIs(registry.get_all_jobs(), unique_obj)

    def test_get_all_jobs_never_returns_an_empty_list(self):
        self.assertNotEqual(registry.get_all_jobs(), [])

    def test_get_all_job_names_returns_value_from_job_metaclass(self):
        unique_obj = object()

        @classmethod
        def get_all_job_names_mock(unused_cls):
            """Returns the unique_obj."""
            return unique_obj

        get_all_job_names_swap = self.swap(
            base_jobs.JobMetaclass,
            'get_all_job_names', get_all_job_names_mock)

        with get_all_job_names_swap:
            self.assertIs(registry.get_all_job_names(), unique_obj)

    def test_get_all_job_names_never_returns_an_empty_list(self):
        self.assertNotEqual(registry.get_all_job_names(), [])
