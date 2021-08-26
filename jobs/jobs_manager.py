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

from core.domain import beam_job_domain
from core.domain import beam_job_services
from core.storage.beam_job import gae_models as beam_job_models
from jobs import job_options
from jobs import registry
from jobs.io import job_io
import python_utils

import apache_beam as beam
from apache_beam import runners

from typing import List
from typing import Optional


def run_job_sync(
        job_name: str,
        job_args: List[str],
        namespace: Optional[str] = None
) -> beam_job_domain.BeamJobRun:
    """Runs the specified job synchronously.

    In other words, the function will wait for the job to finish running before
    returning a value.

    Args:
        job_name: str. The name of the job to run.
        job_args: list(str). The arguments to the job's run() method.
        namespace: str. The namespace in which models should be created.

    Returns:
        BeamJobRun. Contains metadata related to the execution status of the
        job.
    """
    job_pipeline = beam.Pipeline(
        runner=runners.DirectRunner(),
        options=job_options.JobOptions(namespace=namespace))
    job_class = registry.get_job_class_by_name(job_name)

    job = job_class(job_pipeline)
    run_model = beam_job_services.create_beam_job_run_model(job_name, job_args)

    try:
        with job_pipeline:
            unused_pdone = job.run(*job_args) | job_io.PutResults(run_model.id)
    except Exception as exception:
        run_model.latest_job_state = beam_job_models.BeamJobState.FAILED.value
        # If the pipeline fails to put the results into storage, then we'll
        # explicitly write them to storage by using the caught exception.
        result_model = beam_job_services.create_beam_job_run_result_model(
            run_model.id, '', python_utils.UNICODE(exception))
        result_model.put()
    else:
        run_model.latest_job_state = beam_job_models.BeamJobState.DONE.value
    finally:
        run_model.put()

    return beam_job_services.get_beam_job_run_from_model(run_model)
