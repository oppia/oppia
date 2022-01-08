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

"""Jobs that extract Collection models information."""

from __future__ import annotations

from core.domain import user_services
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import collection_models

(collection_models,) = models.Registry.import_models([models.NAMES.collection])
datastore_services = models.Registry.import_datastore_services()


class CountCollectionModelJob(base_jobs.JobBase):
    """Job that generate emails of CollectionModels users."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of 'SUCCESS' or 'FAILURE' results from
        generating email of CollectionModel user.

        Returns:
            PCollection. A PCollection of 'SUCCESS' or 'FAILURE' results from
            generating email of CollectionModel user.
        """
        extract_collection_model = (
            self.pipeline
            | 'Get all collection models' >> ndb_io.GetModels(
                collection_models.CollectionRightsModel.get_all(
                    include_deleted=False))
            | 'Extract user IDs' >> beam.FlatMap(
                    lambda collection_rights: collection_rights.owner_ids)
            | 'Extract emails' >> beam.Map(
                user_services.get_email_from_user_id)
        )

        return (
            extract_collection_model
            | 'Count the output' >> (
                job_result_transforms.CountObjectsToJobRunResult())
        )
