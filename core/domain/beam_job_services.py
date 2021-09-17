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

from __future__ import absolute_import
from __future__ import unicode_literals

from constants import constants
from core.domain import beam_job_domain
from core.jobs import jobs_manager
from core.jobs import registry as jobs_registry
from core.platform import models

from typing import List, Optional # isort: skip

(beam_job_models,) = models.Registry.import_models([models.NAMES.beam_job])

datastore_services = models.Registry.import_datastore_services()
transaction_services = models.Registry.import_transaction_services()


def run_beam_job(job_name: str) -> beam_job_domain.BeamJobRun:
    """Starts a new Apache Beam job and returns metadata about its execution.

    Args:
        job_name: str. The name of the job to run.

    Returns:
        BeamJobRun. Metadata about the run's execution.
    """
    job_class = jobs_registry.get_job_class_by_name(job_name)
    run_synchronously = constants.EMULATOR_MODE

    run_model = jobs_manager.run_job(job_class, run_synchronously)

    return get_beam_job_run_from_model(run_model)


def get_beam_jobs() -> List[beam_job_domain.BeamJob]:
    """Returns the list of all registered Apache Beam jobs.

    Returns:
        list(BeamJob). The list of registered Apache Beam jobs.
    """
    return [beam_job_domain.BeamJob(j) for j in jobs_registry.get_all_jobs()]


def get_beam_job_runs(
    refresh: bool = True
) -> List[beam_job_domain.BeamJobRun]:
    """Returns all of the Apache Beam job runs recorded in the datastore.

    Args:
        refresh: bool. Whether to refresh the jobs' state before returning them.

    Returns:
        list(BeamJobRun). A list of every job run recorded in the datastore.
    """
    beam_job_run_models = list(beam_job_models.BeamJobRunModel.query())
    beam_job_runs = [
        get_beam_job_run_from_model(m) for m in beam_job_run_models
    ]

    if refresh:
        updated_beam_job_run_models = []

        for i, beam_job_run_model in enumerate(beam_job_run_models):
            if beam_job_runs[i].in_terminal_state:
                continue
            jobs_manager.refresh_state_of_beam_job_run_model(beam_job_run_model)
            beam_job_run_model.update_timestamps(update_last_updated_time=False)
            updated_beam_job_run_models.append(beam_job_run_model)
            beam_job_runs[i] = get_beam_job_run_from_model(beam_job_run_model)

        if updated_beam_job_run_models:
            datastore_services.put_multi(updated_beam_job_run_models)

    return beam_job_runs


def get_beam_job_run_result(
    job_id: str
) -> beam_job_domain.AggregateBeamJobRunResult:
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

    return beam_job_domain.AggregateBeamJobRunResult(
        stdout='\n'.join(stdouts), stderr='\n'.join(stderrs))


def create_beam_job_run_model(
    job_name: str,
    dataflow_job_id: Optional[str] = None
) -> beam_job_models.BeamJobRunModel:
    """Creates a new BeamJobRunModel without putting it into storage.

    Args:
        job_name: str. The name of the job class that implements the job's
            logic.
        dataflow_job_id: str|None. The ID of the dataflow job this model
            corresponds to. If the job is run synchronously, then this value
            should be None.

    Returns:
        BeamJobRunModel. The model.
    """
    model_id = beam_job_models.BeamJobRunModel.get_new_id()
    model = beam_job_models.BeamJobRunModel(
        id=model_id, job_name=job_name, dataflow_job_id=dataflow_job_id,
        latest_job_state=beam_job_models.BeamJobState.PENDING.value)
    model.update_timestamps()
    return model


def create_beam_job_run_result_model(
    job_id: str, stdout: str, stderr: str
) -> beam_job_models.BeamJobRunResultModel:
    """Creates a new BeamJobRunResultModel without putting it into storage.

    Args:
        job_id: str. The ID of the job run to fetch.
        stdout: str. The standard output from a job run.
        stderr: str. The error output from a job run.

    Returns:
        BeamJobRunResultModel. The model.
    """
    model_id = beam_job_models.BeamJobRunResultModel.get_new_id()
    model = beam_job_models.BeamJobRunResultModel(
        id=model_id, job_id=job_id, stdout=stdout, stderr=stderr)
    model.update_timestamps()
    return model


def get_beam_job_run_from_model(
    beam_job_run_model: beam_job_models.BeamJobRunModel
) -> beam_job_domain.BeamJobRun:
    """Returns a domain object corresponding to the given BeamJobRunModel.

    Args:
        beam_job_run_model: BeamJobRunModel. The model.

    Returns:
        BeamJobRun. The corresponding domain object.
    """
    return beam_job_domain.BeamJobRun(
        beam_job_run_model.id, beam_job_run_model.job_name,
        beam_job_run_model.latest_job_state, beam_job_run_model.created_on,
        beam_job_run_model.last_updated,
        beam_job_run_model.dataflow_job_id is None)
