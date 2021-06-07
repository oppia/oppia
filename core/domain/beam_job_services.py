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

"""Services for managing Apache Beam jobs."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime
import itertools
import json
import logging
import subprocess

from core.domain import beam_job_domain
from core.platform import models
from jobs import registry as jobs_registry
from scripts import common
import utils

(beam_job_models,) = models.Registry.import_models([models.NAMES.beam_job])

datastore_services = models.Registry.import_datastore_services()
transaction_services = models.Registry.import_transaction_services()

# This is a mapping from the Google Cloud Dataflow JobState enum to our enum.
# https://cloud.google.com/dataflow/docs/reference/rest/v1b3/projects.jobs#jobstate
_GCLOUD_DATAFLOW_JOB_STATE_TO_OPPIA_BEAM_JOB_STATE = {
    # Indicates that the job has not yet started to run.
    'JOB_STATE_STOPPED': beam_job_models.BeamJobState.STOPPED,
    # Indicates that the job is currently running.
    'JOB_STATE_RUNNING': beam_job_models.BeamJobState.RUNNING,
    # Indicates that the job has successfully completed. This is a terminal job
    # state. This state may be set by the Cloud Dataflow service, as a
    # transition from JOB_STATE_RUNNING. It may also be set via a Cloud Dataflow
    # jobs.update call, if the job has not yet reached a terminal state.
    'JOB_STATE_DONE': beam_job_models.BeamJobState.DONE,
    # Indicates that the job has failed. This is a terminal job state. This
    # state may only be set by the Cloud Dataflow service, and only as a
    # transition from JOB_STATE_RUNNING.
    'JOB_STATE_FAILED': beam_job_models.BeamJobState.FAILED,
    # Indicates that the job has been explicitly cancelled. This is a terminal
    # job state. This state may only be set via a Cloud Dataflow jobs.update
    # call, and only if the job has not yet reached another terminal state.
    'JOB_STATE_CANCELLED': beam_job_models.BeamJobState.CANCELLED,
    # Indicates that the job was successfully updated, meaning that this job was
    # stopped and another job was started, inheriting state from this one. This
    # is a terminal job state. This state may only be set by the Cloud Dataflow
    # service, and only as a transition from JOB_STATE_RUNNING.
    'JOB_STATE_UPDATED': beam_job_models.BeamJobState.UPDATED,
    # Indicates that the job is in the process of draining. A draining job has
    # stopped pulling from its input sources and is processing any data that
    # remains in-flight. This state may be set via a Cloud Dataflow jobs.update
    # call, but only as a transition from JOB_STATE_RUNNING. Jobs that are
    # draining may only transition to JOB_STATE_DRAINED, JOB_STATE_CANCELLED, or
    # JOB_STATE_FAILED.
    'JOB_STATE_DRAINING': beam_job_models.BeamJobState.DRAINING,
    # Indicates that the job has been drained. A drained job terminated by
    # stopping pulling from its input sources and processing any data that
    # remained in-flight when draining was requested. This state is a terminal
    # state, may only be set by the Cloud Dataflow service, and only as a
    # transition from JOB_STATE_DRAINING.
    'JOB_STATE_DRAINED': beam_job_models.BeamJobState.DRAINED,
    # Indicates that the job has been created but is not yet running. Jobs that
    # are pending may only transition to JOB_STATE_RUNNING, or JOB_STATE_FAILED.
    'JOB_STATE_PENDING': beam_job_models.BeamJobState.PENDING,
    # Indicates that the job has been created but is being delayed until launch.
    # Jobs that are queued may only transition to JOB_STATE_PENDING or
    # JOB_STATE_CANCELLED.
    'JOB_STATE_QUEUED': beam_job_models.BeamJobState.PENDING,
    # Indicates that the job has been explicitly cancelled and is in the process
    # of stopping. Jobs that are cancelling may only transition to
    # JOB_STATE_CANCELLED or JOB_STATE_FAILED.
    'JOB_STATE_CANCELLING': beam_job_models.BeamJobState.CANCELLING,
}


def get_beam_jobs():
    """Returns the list of all registered Apache Beam jobs.

    Returns:
        list(BeamJob). The list of registered Apache Beam jobs.
    """
    return [beam_job_domain.BeamJob(j) for j in jobs_registry.get_all_jobs()]


def get_beam_job_runs(refresh=False):
    """Returns all of the Apache Beam job runs recorded in the datastore.

    Args:
        refresh: bool. Whether to refresh the jobs' state before returning them.

    Returns:
        list(BeamJobRun). A list of every job run recorded in the datastore.
    """
    beam_job_run_models = _get_all_beam_job_run_models()
    beam_job_runs = [
        _get_beam_job_run_from_model(m) for m in beam_job_run_models
    ]

    if refresh:
        updated_beam_job_run_models = []

        for i, beam_job_run_model in enumerate(beam_job_run_models):
            if beam_job_runs[i].in_terminal_state:
                continue
            _refresh_state_of_beam_job_run_model(beam_job_run_model)
            updated_beam_job_run_models.append(beam_job_run_model)
            beam_job_runs[i] = _get_beam_job_run_from_model(beam_job_run_model)

        if updated_beam_job_run_models:
            datastore_services.put_multi(updated_beam_job_run_models)

    return beam_job_runs


def get_beam_job_run_result(job_id):
    """Returns the result of the given Apache Beam job run.

    Args:
        job_id: str. The ID of the job run to fetch.

    Returns:
        AggregateBeamJobRunResult. The result of the given Apache Beam job run.
    """
    beam_job_run_result_models = beam_job_models.BeamJobRunResultModel.query(
        beam_job_models.BeamJobRunResultModel.job_id == job_id).iter()

    # Job results are inherently unordered; there's no need to sort them.
    stdouts, stderrs = [], []
    for beam_job_run_result_model in beam_job_run_result_models:
        if beam_job_run_result_model.stdout:
            stdouts.append(beam_job_run_result_model.stdout)
        if beam_job_run_result_model.stderr:
            stderrs.append(beam_job_run_result_model.stderr)

    return (
        None if not stdouts and not stderrs else
        beam_job_domain.AggregateBeamJobRunResult(
            stdout='\n'.join(stdouts), stderr='\n'.join(stderrs)))


def refresh_state_of_all_beam_job_run_models():
    """Refreshes the state of all BeamJobRunModels that haven't terminated."""
    beam_job_run_models = _get_all_beam_job_run_models(include_terminated=False)

    for beam_job_run_model in beam_job_run_models:
        _refresh_state_of_beam_job_run_model(beam_job_run_model)

    datastore_services.put_multi(beam_job_run_models)


def _get_beam_job_run_from_model(beam_job_run_model):
    """Returns a domain object corresponding to the given BeamJobRunModel.

    Args:
        beam_job_run_model: BeamJobRunModel. The model.

    Returns:
        BeamJobRun. The corresponding domain object.
    """
    return beam_job_domain.BeamJobRun(
        beam_job_run_model.id, beam_job_run_model.job_name,
        beam_job_run_model.latest_job_state, beam_job_run_model.job_arguments,
        beam_job_run_model.created_on, beam_job_run_model.last_updated,
        beam_job_run_model.dataflow_job_id is None)


def _get_all_beam_job_run_models(include_terminated=True):
    """Returns all of the BeamJobRunModels in the datastore.

    Args:
        include_terminated: bool. Whether the returned list should include jobs
            that have terminated.

    Returns:
        list(BeamJobRunModel). The BeamJobRunModels in the datastore.
    """
    if include_terminated:
        return list(beam_job_models.BeamJobRunModel.query().iter())

    return list(itertools.chain.from_iterable(
        beam_job_models.BeamJobRunModel.query(
            beam_job_models.BeamJobRunModel.latest_job_state == state).iter()
        for state in (
            beam_job_models.BeamJobState.CANCELLING.value,
            beam_job_models.BeamJobState.DRAINING.value,
            beam_job_models.BeamJobState.PENDING.value,
            beam_job_models.BeamJobState.RUNNING.value,
            beam_job_models.BeamJobState.STOPPED.value,
            beam_job_models.BeamJobState.UNKNOWN.value,
        )))


def _refresh_state_of_beam_job_run_model(beam_job_run_model):
    """Refreshs the state of the given BeamJobRunModel.

    Args:
        beam_job_run_model: BeamJobRunModel. The model to update.
    """
    job_id = beam_job_run_model.dataflow_job_id
    if job_id is None:
        beam_job_run_model.latest_job_state = (
            beam_job_models.BeamJobState.UNKNOWN.value)
        beam_job_run_model.update_timestamps()
        return

    try:
        # We need to run a `gcloud` command to get the updated state. Reference:
        # https://cloud.google.com/dataflow/docs/guides/using-command-line-intf#jobs_commands
        #
        # Sample output:
        # {
        #     "createTime": "2015-02-09T19:39:41.140Z",
        #     "currentState": "JOB_STATE_DONE",
        #     "currentStateTime": "2015-02-09T19:56:39.510Z",
        #     "id": "2015-02-09_11_39_40-15635991037808002875",
        #     "name": "tfidf-bchambers-0209193926",
        #     "projectId": "google.com:clouddfe",
        #     "type": "JOB_TYPE_BATCH"
        # }
        job_status = json.loads(subprocess.check_output(
            [common.GCLOUD_PATH, '--format=json', 'dataflow', 'jobs',
             'describe', job_id]))

        updated_state = _GCLOUD_DATAFLOW_JOB_STATE_TO_OPPIA_BEAM_JOB_STATE.get(
            job_status['currentState'],
            beam_job_models.BeamJobState.UNKNOWN).value

        # The currentStateTime value is an ISO 8601 formatted timestamp with
        # nanosecond resolution. Since strftime only supports microsecond
        # resolution, we slice the nanoseconds off so that it can be parsed
        # correctly.
        #
        # For reference, here's a sample value and its relevant indices:
        #
        #     v-- 0               [msec]v-- 26
        #     2015-02-09T19:56:39.510000000Z
        #                         [ nsecs ]^-- 29 or -1
        #
        # Thus, we only keep the slices [:26] and [-1:].
        current_state_time = job_status['currentStateTime']
        current_state_time = current_state_time[:26] + current_state_time[-1:]
        last_updated = datetime.datetime.strptime(
            current_state_time, utils.ISO_8601_DATETIME_FORMAT)

    except subprocess.CalledProcessError:
        logging.exception('Failed to update the state of job_id="%s"!' % job_id)
        raise

    else:
        beam_job_run_model.latest_job_state = updated_state
        beam_job_run_model.last_updated = last_updated
        beam_job_run_model.update_timestamps(update_last_updated_time=False)
