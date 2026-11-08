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

"""Services for managing long-running jobs."""

from __future__ import annotations

import datetime

from core.domain import job_domain
from core.platform import models

from typing import List, Optional, Sequence

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import datastore_services, job_models

(job_models,) = models.Registry.import_models([models.Names.JOB])
datastore_services = models.Registry.import_datastore_services()


def get_job_by_id(job_id: str) -> Optional[job_domain.Job]:
    """Returns the job for the given ID, or None if not found or deleted."""
    job_model = job_models.JobModel.get_by_id(job_id)
    if job_model is None or job_model.deleted:
        return None
    return get_job_from_model(job_model)


def get_job_from_model(job_model: job_models.JobModel) -> job_domain.Job:
    """Returns the domain object corresponding to the given JobModel.

    Args:
        job_model: JobModel. The storage model.

    Returns:
        Job. The corresponding domain object.
    """
    return job_domain.Job(
        job_id=job_model.id,
        job_type=job_model.job_type,
        time_queued_msec=job_model.time_queued_msec,
        time_started_msec=job_model.time_started_msec,
        time_finished_msec=job_model.time_finished_msec,
        status_code=job_model.status_code,
        metadata=job_model.metadata,
        output=job_model.output,
        error=job_model.error,
        has_been_cleaned_up=job_model.has_been_cleaned_up,
        additional_job_params=job_model.additional_job_params,
    )


def get_all_unfinished_jobs(limit: int) -> List[job_domain.Job]:
    """Returns at most the given number of unfinished jobs.

    Args:
        limit: int. The maximum number of unfinished jobs to return.

    Returns:
        list(Job). The unfinished jobs.
    """
    job_models_list: Sequence[job_models.JobModel] = (
        job_models.JobModel.get_all_unfinished_jobs(limit)
    )
    return [get_job_from_model(job_model) for job_model in job_models_list]


def get_unfinished_jobs(job_type: str) -> List[job_domain.Job]:
    """Returns all unfinished jobs of the given type.

    Args:
        job_type: str. The type of jobs to return.

    Returns:
        list(Job). The unfinished jobs of the given type.
    """
    job_models_list: Sequence[job_models.JobModel] = (
        job_models.JobModel.get_unfinished_jobs(job_type).fetch()
    )
    return [get_job_from_model(job_model) for job_model in job_models_list]


def do_unfinished_jobs_exist(job_type: str) -> bool:
    """Checks whether unfinished jobs of the given type exist.

    Args:
        job_type: str. The type of jobs to check.

    Returns:
        bool. Whether any unfinished jobs of the given type exist.
    """
    return job_models.JobModel.do_unfinished_jobs_exist(job_type)


def mark_outdated_jobs_as_deleted(
    date_before_which_to_mark_as_deleted: datetime.datetime,
) -> None:
    """Marks jobs last updated before the given date as deleted.

    Args:
        date_before_which_to_mark_as_deleted: datetime. The cutoff date.
    """
    outdated_job_models: List[job_models.JobModel] = list(
        job_models.JobModel.query(
            job_models.JobModel.last_updated
            < date_before_which_to_mark_as_deleted
        ).fetch()
    )
    for job_model in outdated_job_models:
        job_model.deleted = True
    datastore_services.update_timestamps_multi(outdated_job_models)
    datastore_services.put_multi(outdated_job_models)


def save_job(job: job_domain.Job) -> None:
    """Saves a job to storage.

    Args:
        job: Job. The job to save.
    """
    job.validate()
    job_model = job_models.JobModel.get(job.job_id, strict=False)
    if job_model is None:
        job_model = job_models.JobModel(id=job.job_id)

    job_model.job_type = job.job_type
    job_model.time_queued_msec = job.time_queued_msec
    job_model.time_started_msec = job.time_started_msec
    job_model.time_finished_msec = job.time_finished_msec
    job_model.status_code = job.status_code
    job_model.metadata = job.metadata
    job_model.output = job.output
    job_model.error = job.error
    job_model.has_been_cleaned_up = job.has_been_cleaned_up
    job_model.additional_job_params = job.additional_job_params
    job_model.update_timestamps()
    job_model.put()
