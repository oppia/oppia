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

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs import registry
from core.tests import test_utils


class RegistryTests(test_utils.TestBase):

    unique_obj = object()

    # Here we use object because we need to mock the behavior of
    # 'registry.get_all_jobs' method.
    @classmethod
    def get_all_jobs_mock(cls) -> object:
        """Returns the unique_obj."""
        return cls.unique_obj

    # Here we use object because we need to mock the behavior of
    # 'registry.get_all_jobs_names' method.
    @classmethod
    def get_all_job_names_mock(cls) -> object:
        """Returns the unique_obj."""
        return cls.unique_obj

    # Here we use object because we need to mock the behavior of
    # 'registry.get_job_class_by_name' method.
    @classmethod
    def get_job_class_by_name_mock(cls, unused_name: str) -> object:
        """Returns the unique_obj."""
        return cls.unique_obj

    def test_get_all_jobs_returns_value_from_job_metaclass(self) -> None:
        get_all_jobs_swap = self.swap(
            base_jobs.JobMetaclass, 'get_all_jobs', self.get_all_jobs_mock)

        with get_all_jobs_swap:
            self.assertIs(registry.get_all_jobs(), self.unique_obj)

    def test_get_all_jobs_never_returns_an_empty_list(self) -> None:
        self.assertNotEqual(registry.get_all_jobs(), [])

    def test_get_all_job_names_returns_value_from_job_metaclass(self) -> None:
        get_all_job_names_swap = self.swap(
            base_jobs.JobMetaclass,
            'get_all_job_names', self.get_all_job_names_mock)

        with get_all_job_names_swap:
            self.assertIs(registry.get_all_job_names(), self.unique_obj)

    def test_get_all_job_names_never_returns_an_empty_list(self) -> None:
        self.assertNotEqual(registry.get_all_job_names(), [])

    def test_get_job_class_by_name_returns_value_from_job_metaclass(
        self
    ) -> None:
        get_job_class_by_name_swap = self.swap(
            base_jobs.JobMetaclass,
            'get_job_class_by_name', self.get_job_class_by_name_mock)

        with get_job_class_by_name_swap:
            self.assertIs(
                registry.get_job_class_by_name('arbitrary'), self.unique_obj)
