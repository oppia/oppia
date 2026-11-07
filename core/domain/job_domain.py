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

"""Domain objects for long-running jobs."""

from __future__ import annotations

from core import utils

from typing import Any, Dict, List, Optional


class Job:
    """Encapsulates the data associated with a long-running job."""

    def __init__(
        self,
        job_id: str,
        job_type: str,
        time_queued_msec: float,
        time_started_msec: Optional[float],
        time_finished_msec: Optional[float],
        status_code: str,
        # Here we use type Any because the values in this dictionary can be of any type.
        metadata: Optional[Dict[str, Any]],
        output: Optional[List[str]],
        error: Optional[str],
        has_been_cleaned_up: bool,
        # Here we use type Any because the values in this dictionary can be of any type.
        additional_job_params: Optional[Dict[str, Any]],
    ) -> None:
        """Initializes a Job instance.

        Args:
            job_id: str. The ID of the job.
            job_type: str. The type of the job.
            time_queued_msec: float. The time the job was queued, in
                milliseconds since the epoch.
            time_started_msec: float|None. The time the job was started, in
                milliseconds since the epoch.
            time_finished_msec: float|None. The time the job finished, in
                milliseconds since the epoch.
            status_code: str. The current status of the job.
            metadata: dict(str, *)|None. Additional metadata associated with
                the job.
            output: list(str)|None. The output produced by a completed job.
            error: str|None. The error for a failed or canceled job.
            has_been_cleaned_up: bool. Whether the job's associated models
                have been cleaned up.
            additional_job_params: dict(str, *)|None. Parameters required to
                run the job.
        """
        self.job_id = job_id
        self.job_type = job_type
        self.time_queued_msec = time_queued_msec
        self.time_started_msec = time_started_msec
        self.time_finished_msec = time_finished_msec
        self.status_code = status_code
        self.metadata = metadata
        self.output = output
        self.error = error
        self.has_been_cleaned_up = has_been_cleaned_up
        self.additional_job_params = additional_job_params
        self.validate()

    # Here we use type Any because the values in this dictionary can be of any type.
    def to_dict(self) -> Dict[str, Any]:
        """Returns a dict representation of the Job.

        Returns:
            dict(str, *). The dictionary representation of this job.
        """
        return {
            'job_id': self.job_id,
            'job_type': self.job_type,
            'time_queued_msec': self.time_queued_msec,
            'time_started_msec': self.time_started_msec,
            'time_finished_msec': self.time_finished_msec,
            'status_code': self.status_code,
            'metadata': self.metadata,
            'output': self.output,
            'error': self.error,
            'has_been_cleaned_up': self.has_been_cleaned_up,
            'additional_job_params': self.additional_job_params,
        }

    @classmethod
    # Here we use type Any because the values in this dictionary can be of any type.
    def from_dict(cls, job_dict: Dict[str, Any]) -> Job:
        """Creates a Job from its dictionary representation.

        Args:
            job_dict: dict(str, *). The dictionary representation of a job.

        Returns:
            Job. The corresponding domain object.
        """
        return cls(
            job_id=job_dict['job_id'],
            job_type=job_dict['job_type'],
            time_queued_msec=job_dict['time_queued_msec'],
            time_started_msec=job_dict['time_started_msec'],
            time_finished_msec=job_dict['time_finished_msec'],
            status_code=job_dict['status_code'],
            metadata=job_dict['metadata'],
            output=job_dict['output'],
            error=job_dict['error'],
            has_been_cleaned_up=job_dict['has_been_cleaned_up'],
            additional_job_params=job_dict['additional_job_params'],
        )

    def validate(self) -> None:
        """Validates this job."""
        if not isinstance(self.job_id, str) or not self.job_id:
            raise utils.ValidationError('Job ID must be a non-empty string.')
        if not isinstance(self.job_type, str) or not self.job_type:
            raise utils.ValidationError('Job type must be a non-empty string.')
        if not isinstance(self.has_been_cleaned_up, bool):
            raise utils.ValidationError('has_been_cleaned_up must be a bool.')

        valid_status_codes = (
            'new',
            'queued',
            'started',
            'completed',
            'failed',
            'canceled',
        )
        if self.status_code not in valid_status_codes:
            raise utils.ValidationError('Invalid job status code.')

        for field_name, field_value in (
            ('metadata', self.metadata),
            ('additional_job_params', self.additional_job_params),
        ):
            if field_value is not None and (
                not isinstance(field_value, dict)
                or any(not isinstance(key, str) for key in field_value)
            ):
                raise utils.ValidationError(
                    '%s must be None or a dict with string keys.' % field_name
                )

        if self.status_code == 'completed':
            if self.output is None or not isinstance(self.output, list):
                raise utils.ValidationError(
                    'Completed jobs must have a list output.'
                )
            if any(not isinstance(item, str) for item in self.output):
                raise utils.ValidationError(
                    'Job output must contain only strings.'
                )
        elif self.output is not None:
            raise utils.ValidationError('Only completed jobs can have output.')

        if self.status_code in ('failed', 'canceled'):
            if not isinstance(self.error, str):
                raise utils.ValidationError(
                    'Failed or canceled jobs must have an error string.'
                )
        elif self.error is not None:
            raise utils.ValidationError(
                'Only failed or canceled jobs can have an error.'
            )

        if (
            isinstance(self.time_queued_msec, bool)
            or not isinstance(self.time_queued_msec, (int, float))
            or not self.time_queued_msec > 0
        ):
            raise utils.ValidationError(
                'time_queued_msec must be a number greater than 0.'
            )

        for timestamp_name, timestamp in (
            ('time_started_msec', self.time_started_msec),
            ('time_finished_msec', self.time_finished_msec),
        ):
            if timestamp is not None and (
                isinstance(timestamp, bool)
                or not isinstance(timestamp, (int, float))
            ):
                raise utils.ValidationError(
                    '%s must be None or a number.' % timestamp_name
                )

        if self.status_code in ('new', 'queued'):
            if (
                self.time_started_msec is not None
                or self.time_finished_msec is not None
            ):
                raise utils.ValidationError(
                    'New or queued jobs cannot have start or finish times.'
                )
        elif self.status_code == 'started':
            if (
                self.time_started_msec is None
                or not self.time_started_msec >= self.time_queued_msec
            ):
                raise utils.ValidationError(
                    'Started jobs must have a start time at or after '
                    'the queue time.'
                )
            if self.time_finished_msec is not None:
                raise utils.ValidationError(
                    'Started jobs cannot have a finish time.'
                )
        elif self.status_code == 'completed':
            if (
                self.time_started_msec is None
                or self.time_finished_msec is None
                or not self.time_started_msec >= self.time_queued_msec
                or not self.time_finished_msec >= self.time_started_msec
            ):
                raise utils.ValidationError(
                    'Completed jobs must have ordered start and finish times.'
                )
        elif self.time_finished_msec is None or not (
            self.time_finished_msec >= self.time_queued_msec
        ):
            raise utils.ValidationError(
                'Failed or canceled jobs must finish at or after the '
                'queue time.'
            )
