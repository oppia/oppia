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

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import collection_models
    from mypy_imports import feedback_models
    from mypy_imports import user_models

(
    collection_models, feedback_models, user_models
) = models.Registry.import_models([
    models.NAMES.collection, models.NAMES.feedback, models.NAMES.user])

datastore_services = models.Registry.import_datastore_services()


class GetCollectionOwnersEmailsJob(base_jobs.JobBase):
    """Job that generate emails of CollectionModels users."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of 'SUCCESS' or 'FAILURE' results from
        generating email of CollectionModel user.

        Returns:
            PCollection. A PCollection of 'SUCCESS' or 'FAILURE' results from
            generating email of CollectionModel user.
        """
        collection_user_ids_pcollection = (
            self.pipeline
            | 'Get all collection rights models' >> ndb_io.GetModels(
                collection_models.CollectionRightsModel.get_all(
                    include_deleted=False))
            | 'Extract user IDs' >> beam.FlatMap(
                    lambda collection_rights: collection_rights.owner_ids)
            | 'Remove duplicates' >> beam.Distinct() # pylint: disable=no-value-for-parameter
        )
        collection_user_ids = beam.pvalue.AsIter(
            collection_user_ids_pcollection)

        user_email_pcollection = (
            self.pipeline
            | 'Get all user settings models' >> ndb_io.GetModels(
                user_models.UserSettingsModel.get_all(
                    include_deleted=False))
            | 'Filter model that belong to collection' >> (
                beam.Filter(
                    lambda model, ids: (
                        model.id in ids),
                    ids=collection_user_ids
                ))
            | 'Get e-mail' >> beam.Map(lambda model: model.email)
        )

        return (
            user_email_pcollection
            | 'Count the output' >> (
                job_result_transforms.CountObjectsToJobRunResult())
        )


class MatchEntiryTypeCollectionJob(base_jobs.JobBase):
    """Job that match entity_type as collection."""

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        """Returns a PCollection of 'SUCCESS' or 'FAILURE' results from
        matching entity_type as collection.

        Returns:
            PCollection. A PCollection of 'SUCCESS' or 'FAILURE' results from
            matching entity_type as collection.
        """
        feedback_model_matched_as_collection = (
            self.pipeline
            | 'Get all GeneralFeedbackThread models' >> ndb_io.GetModels(
                feedback_models.GeneralFeedbackThreadModel.get_all(
                    include_deleted=False))
            | 'Extract entity_type' >> beam.Map(
                    lambda feeback_model: feeback_model.entity_type)
            | 'Match entity_type' >> beam.Filter(
                lambda entity_type: entity_type == 'collection')
            | 'print out ' >> beam.Map(print)
        )

        return (
            feedback_model_matched_as_collection
            | 'Count the output' >> (
                job_result_transforms.CountObjectsToJobRunResult())
        )
