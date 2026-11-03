# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Tests for core.domain.job_domain."""

from __future__ import annotations

from core import utils
from core.domain import job_domain
from core.tests import test_utils

from typing import Any, Dict


class JobTests(test_utils.GenericTestBase):
    """Tests for the Job domain object."""

    def _get_valid_job_dict(self) -> Dict[str, Any]:
        """Returns a dictionary representing a valid completed job."""
        return {
            'job_id': 'job_id',
            'job_type': 'job_type',
            'time_queued_msec': 1.0,
            'time_started_msec': 2.0,
            'time_finished_msec': 3.0,
            'status_code': 'completed',
            'metadata': {'key': 'value'},
            'output': ['output'],
            'error': None,
            'has_been_cleaned_up': False,
            'additional_job_params': {'param': 'value'},
        }

    def test_from_dict_and_to_dict(self) -> None:
        job_dict = self._get_valid_job_dict()

        job = job_domain.Job.from_dict(job_dict)

        self.assertEqual(job.to_dict(), job_dict)

    def test_validate_accepts_all_statuses(self) -> None:
        status_dicts = [
            {
                'status_code': 'new',
                'time_started_msec': None,
                'time_finished_msec': None,
                'output': None,
                'error': None,
            },
            {
                'status_code': 'queued',
                'time_started_msec': None,
                'time_finished_msec': None,
                'output': None,
                'error': None,
            },
            {
                'status_code': 'started',
                'time_started_msec': 2.0,
                'time_finished_msec': None,
                'output': None,
                'error': None,
            },
            {
                'status_code': 'completed',
                'time_started_msec': 2.0,
                'time_finished_msec': 3.0,
                'output': [],
                'error': None,
            },
            {
                'status_code': 'failed',
                'time_started_msec': None,
                'time_finished_msec': 3.0,
                'output': None,
                'error': 'failure',
            },
            {
                'status_code': 'canceled',
                'time_started_msec': None,
                'time_finished_msec': 3.0,
                'output': None,
                'error': 'canceled',
            },
        ]
        for status_values in status_dicts:
            with self.subTest(status=status_values['status_code']):
                job_dict = self._get_valid_job_dict()
                job_dict.update(status_values)
                job_domain.Job.from_dict(job_dict).validate()

    def test_validate_rejects_invalid_basic_fields(self) -> None:
        invalid_fields = [
            ('job_id', ''),
            ('job_id', 1),
            ('job_type', ''),
            ('job_type', 1),
            ('has_been_cleaned_up', 'false'),
        ]
        for field_name, value in invalid_fields:
            with self.subTest(field=field_name, value=value):
                job_dict = self._get_valid_job_dict()
                job_dict[field_name] = value
                with self.assertRaises(utils.ValidationError):
                    job_domain.Job.from_dict(job_dict)

    def test_validate_rejects_invalid_status_code(self) -> None:
        job_dict = self._get_valid_job_dict()
        job_dict['status_code'] = 'unknown'

        with self.assertRaises(utils.ValidationError):
            job_domain.Job.from_dict(job_dict)

    def test_validate_rejects_invalid_json_fields(self) -> None:
        invalid_fields = [
            ('metadata', []),
            ('metadata', {1: 'value'}),
            ('additional_job_params', []),
            ('additional_job_params', {1: 'value'}),
        ]
        for field_name, value in invalid_fields:
            with self.subTest(field=field_name, value=value):
                job_dict = self._get_valid_job_dict()
                job_dict[field_name] = value
                with self.assertRaises(utils.ValidationError):
                    job_domain.Job.from_dict(job_dict)

    def test_validate_rejects_invalid_outputs(self) -> None:
        invalid_outputs = [None, 'output', [1]]
        for output in invalid_outputs:
            with self.subTest(output=output):
                job_dict = self._get_valid_job_dict()
                job_dict['output'] = output
                with self.assertRaises(utils.ValidationError):
                    job_domain.Job.from_dict(job_dict)

        job_dict = self._get_valid_job_dict()
        job_dict.update({
            'status_code': 'queued',
            'time_started_msec': None,
            'time_finished_msec': None,
            'output': [],
        })
        with self.assertRaises(utils.ValidationError):
            job_domain.Job.from_dict(job_dict)

    def test_validate_rejects_invalid_errors(self) -> None:
        for status_code in ('failed', 'canceled'):
            for error in (None, 1):
                with self.subTest(status=status_code, error=error):
                    job_dict = self._get_valid_job_dict()
                    job_dict.update({
                        'status_code': status_code,
                        'time_finished_msec': 3.0,
                        'output': None,
                        'error': error,
                    })
                    with self.assertRaises(utils.ValidationError):
                        job_domain.Job.from_dict(job_dict)

        job_dict = self._get_valid_job_dict()
        job_dict['error'] = 'unexpected'
        with self.assertRaises(utils.ValidationError):
            job_domain.Job.from_dict(job_dict)

    def test_validate_rejects_invalid_queue_time(self) -> None:
        for time_queued_msec in (0, -1.0, '1', True, float('nan')):
            with self.subTest(time_queued_msec=time_queued_msec):
                job_dict = self._get_valid_job_dict()
                job_dict['time_queued_msec'] = time_queued_msec
                with self.assertRaises(utils.ValidationError):
                    job_domain.Job.from_dict(job_dict)

    def test_validate_rejects_invalid_optional_timestamp_types(self) -> None:
        for field_name in ('time_started_msec', 'time_finished_msec'):
            job_dict = self._get_valid_job_dict()
            job_dict[field_name] = '2'
            with self.subTest(field=field_name):
                with self.assertRaises(utils.ValidationError):
                    job_domain.Job.from_dict(job_dict)

    def test_validate_rejects_nan_timestamps(self) -> None:
        job_dict = self._get_valid_job_dict()
        job_dict['time_started_msec'] = float('nan')
        with self.assertRaises(utils.ValidationError):
            job_domain.Job.from_dict(job_dict)

    def test_validate_rejects_timestamps_inconsistent_with_status(self) -> None:
        invalid_timestamp_updates = [
            {
                'status_code': 'new',
                'time_started_msec': 2.0,
                'time_finished_msec': None,
            },
            {
                'status_code': 'queued',
                'time_started_msec': None,
                'time_finished_msec': 3.0,
            },
            {
                'status_code': 'started',
                'time_started_msec': None,
                'time_finished_msec': None,
            },
            {
                'status_code': 'started',
                'time_started_msec': 0.5,
                'time_finished_msec': None,
            },
            {
                'status_code': 'started',
                'time_started_msec': 2.0,
                'time_finished_msec': 3.0,
            },
            {
                'status_code': 'completed',
                'time_started_msec': None,
                'time_finished_msec': 3.0,
            },
            {
                'status_code': 'completed',
                'time_started_msec': 2.0,
                'time_finished_msec': None,
            },
            {
                'status_code': 'completed',
                'time_started_msec': 0.5,
                'time_finished_msec': 3.0,
            },
            {
                'status_code': 'completed',
                'time_started_msec': 2.0,
                'time_finished_msec': 1.5,
            },
            {
                'status_code': 'failed',
                'time_started_msec': None,
                'time_finished_msec': None,
            },
            {
                'status_code': 'failed',
                'time_started_msec': None,
                'time_finished_msec': 0.5,
            },
            {
                'status_code': 'canceled',
                'time_started_msec': None,
                'time_finished_msec': None,
            },
            {
                'status_code': 'canceled',
                'time_started_msec': None,
                'time_finished_msec': 0.5,
            },
        ]
        for timestamp_update in invalid_timestamp_updates:
            with self.subTest(status=timestamp_update['status_code']):
                job_dict = self._get_valid_job_dict()
                job_dict.update(timestamp_update)
                if timestamp_update['status_code'] in ('new', 'queued'):
                    job_dict['output'] = None
                if timestamp_update['status_code'] in ('failed', 'canceled'):
                    job_dict['output'] = None
                    job_dict['error'] = 'failure'
                if timestamp_update['status_code'] == 'started':
                    job_dict['output'] = None
                with self.assertRaises(utils.ValidationError):
                    job_domain.Job.from_dict(job_dict)
