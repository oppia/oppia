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

from core.platform import models
import python_utils
import utils

(beam_job_models,) = models.Registry.import_models([models.NAMES.beam_job])

# NOTE: The following values are constants from an enum defined by Google Cloud
# Dataflow, and are thus outside of our control:
# https://cloud.google.com/dataflow/docs/reference/rest/v1b3/projects.jobs#jobstate

BeamJobState = python_utils.create_enum( # pylint: disable=invalid-name
    # The job is currently running.
    'RUNNING',
    # The job has been created but is not yet running. Jobs that are pending may
    # only transition to RUNNING, or FAILED.
    'PENDING',
    # The job has not yet started to run.
    'STOPPED',
    # The job has has been explicitly cancelled and is in the process of
    # stopping. Jobs that are cancelling may only transition to CANCELLED or
    # FAILED.
    'CANCELLING',
    # The job has has been explicitly cancelled. This is a terminal job state.
    # This state may only be set via a Cloud Dataflow jobs.update call, and only
    # if the job has not yet reached another terminal state.
    'CANCELLED',
    # The job is in the process of draining. A draining job has stopped pulling
    # from its input sources and is processing any data that remains in-flight.
    # This state may be set via a Cloud Dataflow jobs.update call, but only as a
    # transition from RUNNING. Jobs that are draining may only transition to
    # DRAINED, CANCELLED, or FAILED.
    'DRAINING',
    # The job has been drained. A drained job terminated by stopping pulling
    # from its input sources and processing any data that remained in-flight
    # when draining was requested. This state is a terminal state, may only be
    # set by the Cloud Dataflow service, and only as a transition from DRAINING.
    'DRAINED',
    # The job was successfully updated, meaning that this job was stopped and
    # another job was started, inheriting state from this one. This is a
    # terminal job state. This state may only be set by the Cloud Dataflow
    # service, and only as a transition from RUNNING.
    'UPDATED',
    # The job has successfully completed. This is a terminal job state. This
    # state may be set by the Cloud Dataflow service, as a transition from
    # RUNNING. It may also be set via a Cloud Dataflow jobs.update call, if the
    # job has not yet reached a terminal state.
    'DONE',
    # The job has has failed. This is a terminal job state. This state may only
    # be set by the Cloud Dataflow service, and only as a transition from
    # RUNNING.
    'FAILED',
    # The job's run state isn't specified.
    'UNKNOWN')


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

    @property
    def in_terminal_state(self):
        """Returns whether the job run has reached a terminal state and is no
        longer running.

        Returns:
            bool. Whether the job has reached a terminal state.
        """
        return self.job_state in [
            beam_job_models.BeamJobState.CANCELLED.value,
            beam_job_models.BeamJobState.DRAINED.value,
            beam_job_models.BeamJobState.UPDATED.value,
            beam_job_models.BeamJobState.DONE.value,
            beam_job_models.BeamJobState.FAILED.value,
        ]

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
