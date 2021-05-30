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

_GCLOUD_DATAFLOW_JOB_STATE_TO_OPPIA_BEAM_JOB_STATE = {
    'JOB_STATE_STOPPED': beam_job_models.BEAM_JOB_STATE_STOPPED,
    'JOB_STATE_RUNNING': beam_job_models.BEAM_JOB_STATE_RUNNING,
    'JOB_STATE_DONE': beam_job_models.BEAM_JOB_STATE_DONE,
    'JOB_STATE_FAILED': beam_job_models.BEAM_JOB_STATE_FAILED,
    'JOB_STATE_CANCELLED': beam_job_models.BEAM_JOB_STATE_CANCELLED,
    'JOB_STATE_UPDATED': beam_job_models.BEAM_JOB_STATE_UPDATED,
    'JOB_STATE_DRAINING': beam_job_models.BEAM_JOB_STATE_DRAINING,
    'JOB_STATE_DRAINED': beam_job_models.BEAM_JOB_STATE_DRAINED,
    'JOB_STATE_PENDING': beam_job_models.BEAM_JOB_STATE_PENDING,
    'JOB_STATE_QUEUED': beam_job_models.BEAM_JOB_STATE_PENDING,
    'JOB_STATE_CANCELLING': beam_job_models.BEAM_JOB_STATE_CANCELLING,
}


def get_beam_jobs():
    """Returns the definitions of all registered Apache Beam jobs.

    Returns:
        list(BeamJob). A list of job definitions.
    """
    return [beam_job_domain.BeamJob(j) for j in jobs_registry.get_all_jobs()]


def get_beam_job_runs(force_update=False):
    """Returns all of the Apache Beam job runs recorded in the datastore.

    Args:
        force_update: bool. Whether to refresh the jobs' state before returning
            them.

    Returns:
        list(BeamJobRun). A list of every job run recorded in the datastore.
    """
    beam_job_run_models = _get_all_beam_job_run_models()

    if force_update:
        _update_beam_job_run_model_states(
            [m for m in beam_job_run_models if not m.in_terminal_state])

    return [_get_beam_job_run_from_model(m) for m in beam_job_run_models]


def get_beam_job_run_result(job_id):
    """Returns the result of the given Apache Beam job run.

    Args:
        job_id: str. The ID of the job to fetch.

    Returns:
        BeamJobRunResult. The result of the given Apache Beam job run.
    """
    beam_job_run_result_model = (
        beam_job_models.BeamJobRunResultModel.get(job_id, strict=False))
    return (
        None if beam_job_run_result_model is None else
        beam_job_domain.BeamJobRunResult(
            beam_job_run_result_model.stdout, beam_job_run_result_model.stderr))


def update_beam_job_run_model_states():
    """Refreshes the state of all BeamJobRunModels that haven't terminated.

    This operation puts the models back into storage transactionally.
    """
    _update_beam_job_run_model_states(
        _get_all_beam_job_run_models(include_terminated=False))


def _update_beam_job_run_model_states(beam_job_run_models):
    """Refreshes the state of the given BeamJobRunModels.

    This operation puts the models into storage transactionally.

    Args:
        beam_job_run_models: list(BeamJobRunModel). The models to update.
    """
    # Update the timestamps first because we want the
    # _refresh_beam_job_run_model_state() function to set last_updated to the
    # _actual_ time the state was last updated.
    datastore_services.update_timestamps_multi(beam_job_run_models)

    for beam_job_run_model in beam_job_run_models:
        _refresh_beam_job_run_model_state(beam_job_run_model)

    datastore_services.put_multi(beam_job_run_models)


def _get_beam_job_run_from_model(beam_job_run_model):
    """Returns a corresponding domain object for the given BeamJobRunModel.

    Args:
        beam_job_run_model: BeamJobRunModel. The model.

    Returns:
        BeamJobRun. The corresponding domain object.
    """
    return beam_job_domain.BeamJobRun(
        beam_job_run_model.id, beam_job_run_model.job_name,
        beam_job_run_model.latest_job_state, beam_job_run_model.job_arguments,
        beam_job_run_model.created_on, beam_job_run_model.last_updated)


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
    else:
        non_terminated_states = [beam_job_models.BEAM_JOB_STATE_CANCELLING,
                                 beam_job_models.BEAM_JOB_STATE_DRAINING,
                                 beam_job_models.BEAM_JOB_STATE_PENDING,
                                 beam_job_models.BEAM_JOB_STATE_RUNNING,
                                 beam_job_models.BEAM_JOB_STATE_STOPPED,
                                 beam_job_models.BEAM_JOB_STATE_UNKNOWN]
        return list(itertools.chain.from_iterable(
            beam_job_models.BeamJobRunModel.query(
                beam_job_models.BeamJobRunModel.latest_job_state == state
            ).iter()
            for state in non_terminated_states))


def _refresh_beam_job_run_model_state(beam_job_run_model):
    """Refreshs the state of the given BeamJobRunModel.

    Args:
        beam_job_run_model: BeamJobRunModel. The model to update.
    """
    job_id = beam_job_run_model.id
    try:
        # Sample output from this command:
        # {
        #     "createTime": "2015-02-09T19:39:41.140Z",
        #     "currentState": "JOB_STATE_DONE",
        #     "currentStateTime": "2015-02-09T19:56:39.510Z",
        #     "id": "2015-02-09_11_39_40-15635991037808002875",
        #     "name": "tfidf-bchambers-0209193926",
        #     "projectId": "google.com:clouddfe",
        #     "type": "JOB_TYPE_BATCH"
        # }
        #
        # Reference:
        # https://cloud.google.com/dataflow/docs/guides/using-command-line-intf#jobs_commands
        job_description = json.loads(subprocess.check_output(
            [common.GCLOUD_PATH, '--format=json', 'dataflow', 'jobs',
             'describe', job_id]))

        updated_state = _GCLOUD_DATAFLOW_JOB_STATE_TO_OPPIA_BEAM_JOB_STATE.get(
            job_description['currentState'],
            beam_job_models.BEAM_JOB_STATE_UNKNOWN)

        # The currentStateTime value uses nanosecond resolution. Since strftime
        # only supports microsecond resolution, we slice the nanoseconds off so
        # that it can be parsed correctly.
        #
        # For reference, here's a sample value and its key indices:
        #     | <- 0                    | <- 26
        #     2015-02-09T19:56:39.510000000Z
        #                         [msec]   | <- 29 or -1
        #                         [nsec   ]
        # Thus, we only keep the slices [:26] + [-1:]
        current_state_time = job_description['currentStateTime']
        current_state_time = current_state_time[:26] + current_state_time[-1:]
        last_updated = datetime.datetime.strptime(
            current_state_time, utils.ISO_8601_DATETIME_FORMAT)

    except subprocess.CalledProcessError:
        logging.exception('Failed to update the state of job_id="%s"' % job_id)
        raise

    else:
        beam_job_run_model.latest_job_state = updated_state
        beam_job_run_model.last_updated = last_updated
