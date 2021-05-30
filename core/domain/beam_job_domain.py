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

"""Services for managing user authentication."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import python_utils
import utils


class BeamJob(python_utils.OBJECT):
    """Represents the definition of an Apache Beam job.

    Attributes:
        name: str. The name of the job class that implements its logic.
        parameter_names: list(str). The name of the parameters the job accepts
            as arguments.
    """

    def __init__(self, job_class):
        """Initializes a new instance of BeamJob.

        Args:
            job_class: type(JobBase). The JobBase subclass which implements the
                job's logic.
        """
        self._job_class = job_class

    @property
    def name(self):
        """Returns the name of the job class that implements its logic.

        Returns:
            str. The name of the job class.
        """
        return self._job_class.__name__

    @property
    def parameter_names(self):
        """Returns the name of the parameters the job accepts as arguments.

        Returns:
            list(str). The name of the parameters.
        """
        return python_utils.get_args_of_function(self._job_class.run)[1:]

    def to_dict(self):
        """Returns a dict representation of the instance.

        Returns:
            dict(str: *). The dict has the following structure:
                name: str. The name of the job class that implements its logic.
                parameter_names: list(str). The name of the parameters the job
                    accepts as arguments.
        """
        return {
            'name': self.name,
            'parameter_names': self.parameter_names,
        }


class BeamJobRun(python_utils.OBJECT):
    """Domain object to represent an individual execution of an Apache Beam job.

    Attributes:
        job_id: str. The name of the job class that implements the job's logic.
        job_name: str. The arguments provided to the job run.
        job_state: str. The state of the job at the time the model was last
            updated.
        job_arguments: list(str). The arguments provided to the job run.
        job_started_on: datetime. The time at which the job was created.
        job_updated_on: datetime. The time at which the job's state was last
            updated.
    """

    def __init__(
            self, job_id, job_name, job_state, job_arguments, job_started_on,
            job_updated_on):
        """Initializes a new BeamJobRun instance.

        Args:
            job_id: str. The name of the job class that implements the job's
                logic.
            job_name: str. The arguments provided to the job run.
            job_state: str. The state of the job at the time the model was last
                updated.
            job_arguments: list(str). The arguments provided to the job run.
            job_started_on: datetime. The time at which the job was created.
            job_updated_on: datetime. The time at which the job's state was last
                updated.
        """
        self.job_id = job_id
        self.job_name = job_name
        self.job_state = job_state
        self.job_arguments = job_arguments
        self.job_started_on = job_started_on
        self.job_updated_on = job_updated_on

    def to_dict(self):
        """Returns a dict representation of the instance.

        Returns:
            dict(str: *). The dict has the following structure:
                job_id: str. The name of the job class that implements the job's
                    logic.
                job_name: str. The arguments provided to the job run.
                job_state: str. The state of the job at the time the model was
                    last updated.
                job_arguments: list(str). The arguments provided to the job run.
                job_started_on_msecs: int. The number of milliseconds since UTC
                    epoch at which the job was created.
                job_updated_on_msecs: int. The number of milliseconds since UTC
                    epoch at which the job's state was last updated.
        """
        return {
            'job_id': self.job_id,
            'job_name': self.job_name,
            'job_state': self.job_state,
            'job_arguments': self.job_arguments,
            'job_started_on_msecs': (
                utils.get_time_in_millisecs(self.job_started_on)),
            'job_updated_on_msecs': (
                utils.get_time_in_millisecs(self.job_updated_on)),
        }


class BeamJobRunResult(python_utils.OBJECT):
    """Represents the result of an Apache Beam job run.

    Attributes:
        stdout: str. The unordered standard output from the job.
        stderr: str. The unordered error output from the job.
    """

    def __init__(self, stdout, stderr):
        """Initializes a new instance of BeamJobRunResult.

        Args:
            stdout: list(str). The unordered standard output from the job.
            stderr: list(str). The unordered error output from the job.
        """
        self.stdout = stdout
        self.stderr = stderr

    def to_dict(self):
        """Returns a dict representation of the instance.

        Returns:
            dict(str: str). The dict structure is:
                stdout: str. The standard output from the job.
                stderr: str. The error output from the job.
        """
        return {'stdout': self.stdout, 'stderr': self.stderr}
