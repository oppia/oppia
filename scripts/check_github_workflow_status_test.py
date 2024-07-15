# Copyright 2024 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the 'License');
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an 'AS-IS' BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Unit tests for scripts/get_github_workflow_status.py."""

from __future__ import annotations

import json
import os
import tempfile

from core.tests import test_utils
from . import check_github_workflow_status


class CheckGithubWorkflowStatusTests(test_utils.GenericTestBase):
    def setUp(self) -> None:
        super().setUp()
        self.temp_dir = tempfile.TemporaryDirectory()
        self.github_output_file_path = os.path.join(
            self.temp_dir.name, 'github_output.json')
        os.environ['GITHUB_OUTPUT'] = self.github_output_file_path

    def tearDown(self) -> None:
        super().tearDown()
        self.temp_dir.cleanup()

    def get_workflow_status_from_github_output(self) -> str:
        """Gets the workflow status from the GitHub output file."""
        with open(os.environ['GITHUB_OUTPUT'], 'r', encoding='utf-8') as f:
            workflow_status = f.read().split('=')[1].strip()
            return workflow_status

    def test_get_github_workflow_status_with_job_failure(self) -> None:
        jobs = {
            'job1': {'result': 'success'},
            'job2': {'result': 'failure'},
            'job3': {'result': 'success'},
        }

        check_github_workflow_status.main(['--jobs', json.dumps(jobs)])
        self.assertEqual(
            self.get_workflow_status_from_github_output(), 'failure')

    def test_get_github_workflow_status_with_all_jobs_success(self) -> None:
        jobs = {
            'job1': {'result': 'success'},
            'job2': {'result': 'success'},
            'job3': {'result': 'success'},
        }

        check_github_workflow_status.main(['--jobs', json.dumps(jobs)])
        self.assertEqual(
            self.get_workflow_status_from_github_output(), 'success')

    def test_get_github_workflow_status_with_jobs_success_or_skipped(
        self
    ) -> None:
        jobs = {
            'job1': {'result': 'skipped'},
            'job2': {'result': 'success'},
            'job3': {'result': 'success'},
        }

        check_github_workflow_status.main(['--jobs', json.dumps(jobs)])
        self.assertEqual(
            self.get_workflow_status_from_github_output(), 'success')
