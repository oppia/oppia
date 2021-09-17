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

"""Services for executing Apache Beam jobs."""

from __future__ import absolute_import
from __future__ import unicode_literals

import contextlib
import logging
import pprint

from core.domain import beam_job_services
from core.storage.beam_job import gae_models as beam_job_models
import feconf
from jobs import base_jobs
from jobs import job_options
from jobs.io import job_io
import python_utils

import apache_beam as beam
from apache_beam import runners
from google.cloud import dataflow

from typing import Iterator, Optional, Type

# This is a mapping from the Google Cloud Dataflow JobState enum to our enum.
# https://cloud.google.com/dataflow/docs/reference/rest/v1b3/projects.jobs#jobstate
_GCLOUD_DATAFLOW_JOB_STATE_TO_OPPIA_BEAM_JOB_STATE = {
    # Indicates that the job has not yet started to run.
    dataflow.JobState.JOB_STATE_STOPPED: beam_job_models.BeamJobState.STOPPED,
    # Indicates that the job is currently running.
    dataflow.JobState.JOB_STATE_RUNNING: beam_job_models.BeamJobState.RUNNING,
    # Indicates that the job has successfully completed. This is a terminal job
    # state. This state may be set by the Cloud Dataflow service, as a
    # transition from JOB_STATE_RUNNING. It may also be set via a Cloud Dataflow
    # jobs.update call, if the job has not yet reached a terminal state.
    dataflow.JobState.JOB_STATE_DONE: beam_job_models.BeamJobState.DONE,
    # Indicates that the job has failed. This is a terminal job state. This
    # state may only be set by the Cloud Dataflow service, and only as a
    # transition from JOB_STATE_RUNNING.
    dataflow.JobState.JOB_STATE_FAILED: beam_job_models.BeamJobState.FAILED,
    # Indicates that the job has been explicitly cancelled. This is a terminal
    # job state. This state may only be set via a Cloud Dataflow jobs.update
    # call, and only if the job has not yet reached another terminal state.
    dataflow.JobState.JOB_STATE_CANCELLED: (
        beam_job_models.BeamJobState.CANCELLED),
    # Indicates that the job was successfully updated, meaning that this job was
    # stopped and another job was started, inheriting state from this one. This
    # is a terminal job state. This state may only be set by the Cloud Dataflow
    # service, and only as a transition from JOB_STATE_RUNNING.
    dataflow.JobState.JOB_STATE_UPDATED: beam_job_models.BeamJobState.UPDATED,
    # Indicates that the job is in the process of draining. A draining job has
    # stopped pulling from its input sources and is processing any data that
    # remains in-flight. This state may be set via a Cloud Dataflow jobs.update
    # call, but only as a transition from JOB_STATE_RUNNING. Jobs that are
    # draining may only transition to JOB_STATE_DRAINED, JOB_STATE_CANCELLED, or
    # JOB_STATE_FAILED.
    dataflow.JobState.JOB_STATE_DRAINING: beam_job_models.BeamJobState.DRAINING,
    # Indicates that the job has been drained. A drained job terminated by
    # stopping pulling from its input sources and processing any data that
    # remained in-flight when draining was requested. This state is a terminal
    # state, may only be set by the Cloud Dataflow service, and only as a
    # transition from JOB_STATE_DRAINING.
    dataflow.JobState.JOB_STATE_DRAINED: beam_job_models.BeamJobState.DRAINED,
    # Indicates that the job has been created but is not yet running. Jobs that
    # are pending may only transition to JOB_STATE_RUNNING, or JOB_STATE_FAILED.
    dataflow.JobState.JOB_STATE_PENDING: beam_job_models.BeamJobState.PENDING,
    # Indicates that the job has been created but is being delayed until launch.
    # Jobs that are queued may only transition to JOB_STATE_PENDING or
    # JOB_STATE_CANCELLED.
    dataflow.JobState.JOB_STATE_QUEUED: beam_job_models.BeamJobState.PENDING,
    # Indicates that the job has been explicitly cancelled and is in the process
    # of stopping. Jobs that are cancelling may only transition to
    # JOB_STATE_CANCELLED or JOB_STATE_FAILED.
    dataflow.JobState.JOB_STATE_CANCELLING: (
        beam_job_models.BeamJobState.CANCELLING),
}


def run_job(
    job_class: Type[base_jobs.JobBase],
    sync: bool,
    namespace: Optional[str] = None,
    pipeline: Optional[beam.Pipeline] = None
) -> beam_job_models.BeamJobRunModel:
    """Runs the specified job synchronously.

    In other words, the function will wait for the job to finish running before
    returning a value.

    Args:
        job_class: type(base_jobs.JobBase). The type of job to run.
        sync: bool. Whether to run the job synchronously.
        namespace: str. The namespace in which models should be created.
        pipeline: Pipeline. The pipeline to run the job upon. If omitted, then a
            new pipeline will be used instead.

    Returns:
        BeamJobRun. Contains metadata related to the execution status of the
        job.
    """
    if pipeline is None:
        pipeline = beam.Pipeline(
            runner=runners.DirectRunner() if sync else runners.DataflowRunner(),
            options=job_options.JobOptions(
                namespace=namespace,
                experiment='use_runner_v2',
                sdk_container_image=''
            )
        )

    with _job_bookkeeping_context(job_class.__name__) as run_model:
        job = job_class(pipeline)

        unused_pdone = job.run() | job_io.PutResults(run_model.id)

        run_result = pipeline.run()

        if sync:
            run_result.wait_until_finish()
            run_model.latest_job_state = beam_job_models.BeamJobState.DONE.value
        else:
            run_model.dataflow_job_id = run_result.job_id()
            run_model.latest_job_state = run_result.state

    return run_model


def refresh_state_of_beam_job_run_model(
    beam_job_run_model: beam_job_models.BeamJobRunModel
) -> None:
    """Refreshs the state of the given BeamJobRunModel.

    Args:
        beam_job_run_model: BeamJobRunModel. The model to update.
    """
    job_id = beam_job_run_model.dataflow_job_id
    if job_id is None:
        beam_job_run_model.latest_job_state = (
            beam_job_models.BeamJobState.UNKNOWN.value)
        beam_job_run_model.update_timestamps(update_last_updated_time=False)
        return

    try:
        get_job_request = dataflow.GetJobRequest(
            job_id=job_id, project_id=feconf.OPPIA_PROJECT_ID,
            location=feconf.GOOGLE_APP_ENGINE_REGION)
        job = dataflow.JobsV1Beta3Client().get_job(request=get_job_request)

        updated_state = _GCLOUD_DATAFLOW_JOB_STATE_TO_OPPIA_BEAM_JOB_STATE.get(
            job.current_state, beam_job_models.BeamJobState.UNKNOWN).value
        last_updated = job.current_state_time.replace(tzinfo=None)

        if (beam_job_run_model.latest_job_state != updated_state and
                updated_state == beam_job_models.BeamJobState.FAILED.value):
            _put_job_stderr(
                beam_job_run_model.id, pprint.pformat(job, indent=2))

    except Exception:
        logging.exception('Failed to update the state of job_id="%s"!' % job_id)
        raise

    else:
        beam_job_run_model.latest_job_state = updated_state
        beam_job_run_model.last_updated = last_updated
        beam_job_run_model.update_timestamps(update_last_updated_time=False)


@contextlib.contextmanager
def _job_bookkeeping_context(
    job_name: str
) -> Iterator[beam_job_models.BeamJobRunModel]:
    """Returns a context manager which commits failure details if an exception
    occurs.

    Args:
        job_name: str. The name of the job.

    Yields:
        BeamJobRunModel. The bookkeeping model used to record execution details.
    """
    run_model = beam_job_services.create_beam_job_run_model(job_name)

    try:
        yield run_model

    except Exception as exception:
        run_model.latest_job_state = beam_job_models.BeamJobState.FAILED.value
        _put_job_stderr(run_model.id, python_utils.UNICODE(exception))

    finally:
        run_model.put()


def _put_job_stderr(job_id: str, stderr: str) -> None:
    """Puts the given error string as a result from the given job.

    Args:
        job_id: str. The ID of the job that failed.
        stderr: str. The error output for the given job.
    """
    result_model = (
        beam_job_services.create_beam_job_run_result_model(job_id, '', stderr))
    result_model.put()
