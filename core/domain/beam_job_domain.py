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

"""Domain objects related to Apache Beam jobs."""

from __future__ import annotations

import datetime

from core import utils
from core.jobs import base_jobs

from typing import Dict, List, Type, Union


class BeamJob:
    """Encapsulates the definition of an Apache Beam job.

    Attributes:
        name: str. The name of the class that implements the job's logic.
    """

    def __init__(self, job_class: Type[base_jobs.JobBase]) -> None:
        """Initializes a new instance of BeamJob.

        Args:
            job_class: type(JobBase). The JobBase subclass which implements the
                job's logic.
        """
        self._job_class = job_class

    @property
    def name(self) -> str:
        """Returns the name of the class that implements the job's logic.

        Returns:
            str. The name of the job class.
        """
        return self._job_class.__name__

    def to_dict(self) -> Dict[str, Union[str, List[str]]]:
        """Returns a dict representation of the BeamJob.

        Returns:
            dict(str: *). The dict has the following structure:
                name: str. The name of the class that implements the job's
                    logic.
        """
        return {'name': self.name}


class BeamJobRun:
    """Encapsulates an individual execution of an Apache Beam job.

    Attributes:
        job_id: str. The ID of the job execution.
        job_name: str. The name of the job class that implements the job's
            logic.
        job_state: str. The state of the job at the time the model was last
            updated.
        job_started_on: datetime. The time at which the job was started.
        job_updated_on: datetime. The time at which the job's state was last
            updated.
        job_is_synchronous: bool. Whether the job has been run synchronously.
            Synchronous jobs are similar to function calls that return
            immediately. Asynchronous jobs are similar to JavaScript Promises
            that return nothing immediately but then _eventually_ produce a
            result.
    """

    def __init__(
            self,
            job_id: str,
            job_name: str,
            job_state: str,
            job_started_on: datetime.datetime,
            job_updated_on: datetime.datetime,
            job_is_synchronous: bool
    ) -> None:
        """Initializes a new BeamJobRun instance.

        Args:
            job_id: str. The ID of the job execution.
            job_name: str. The name of the job class that implements the job's
                logic.
            job_state: str. The state of the job at the time the model was last
                updated.
            job_started_on: datetime. The time at which the job was started.
            job_updated_on: datetime. The time at which the job's state was last
                updated.
            job_is_synchronous: bool. Whether the job has been run
                synchronously.
        """
        self.job_id = job_id
        self.job_name = job_name
        self.job_state = job_state
        self.job_started_on = job_started_on
        self.job_updated_on = job_updated_on
        self.job_is_synchronous = job_is_synchronous

    def to_dict(self) -> Dict[str, Union[bool, float, str, List[str]]]:
        """Returns a dict representation of the BeamJobRun.

        Returns:
            dict(str: *). The dict has the following structure:
                job_id: str. The ID of the job execution.
                job_name: str. The name of the job class that implements the
                    job's logic.
                job_state: str. The state of the job at the time the model was
                    last updated.
                job_started_on_msecs: float. The number of milliseconds since
                    UTC epoch at which the job was created.
                job_updated_on_msecs: float. The number of milliseconds since
                    UTC epoch at which the job's state was last updated.
                job_is_synchronous: bool. Whether the job has been run
                    synchronously.
        """
        return {
            'job_id': self.job_id,
            'job_name': self.job_name,
            'job_state': self.job_state,
            'job_started_on_msecs': (
                utils.get_time_in_millisecs(self.job_started_on)),
            'job_updated_on_msecs': (
                utils.get_time_in_millisecs(self.job_updated_on)),
            'job_is_synchronous': self.job_is_synchronous,
        }


class AggregateBeamJobRunResult:
    """Encapsulates the complete result of an Apache Beam job run.

    Attributes:
        stdout: str. The standard output produced by the job.
        stderr: str. The error output produced by the job.
    """

    def __init__(self, stdout: str, stderr: str) -> None:
        """Initializes a new instance of AggregateBeamJobRunResult.

        Args:
            stdout: str. The standard output produced by the job.
            stderr: str. The error output produced by the job.
        """
        self.stdout = stdout
        self.stderr = stderr

    def to_dict(self) -> Dict[str, str]:
        """Returns a dict representation of the AggregateBeamJobRunResult.

        Returns:
            dict(str: str). The dict structure is:
                stdout: str. The standard output produced by the job.
                stderr: str. The error output produced by the job.
        """
        return {
            'stdout': self.stdout,
            'stderr': self.stderr,
        }
