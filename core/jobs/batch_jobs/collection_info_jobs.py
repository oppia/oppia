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

from typing import Iterable, Tuple

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import collection_models
    from mypy_imports import feedback_models
    from mypy_imports import user_models

(collection_models, feedback_models, user_models) = (
    models.Registry.import_models([
        models.Names.COLLECTION, models.Names.FEEDBACK, models.Names.USER
    ])
)


class GetCollectionOwnersEmailsJob(base_jobs.JobBase):
    """Job that extracts collection id and user email from datastore."""

    @staticmethod
    def _extract_user_and_collection_ids(
        collection_rights_model: collection_models.CollectionRightsModel
    ) -> Iterable[Tuple[str, str]]:
        """Extracts user id and collection id.

        Args:
            collection_rights_model: datastore_services.Model.
                The collection rights model to extract user id and
                collection id from.

        Yields:
            (str,str). Tuple containing user id and collection id.
        """
        for user_id in collection_rights_model.owner_ids:
            yield (user_id, collection_rights_model.id)

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:

        collection_pairs = (
            self.pipeline
            | 'get collection models ' >> ndb_io.GetModels(
                collection_models.CollectionRightsModel.get_all())
            | 'Flatten owner_ids and format' >> beam.FlatMap(
                self._extract_user_and_collection_ids)
        )

        user_pairs = (
            self.pipeline
            | 'Get all user settings models' >> ndb_io.GetModels(
                user_models.UserSettingsModel.get_all())
            | 'Extract id and email' >> beam.Map(
                    lambda user_setting: (
                        user_setting.id, user_setting.email))
        )

        collection_ids_to_email_mapping = (
            (collection_pairs, user_pairs)
            | 'Group by user_id' >> beam.CoGroupByKey()
            | 'Drop user id' >> beam.Values()  # pylint: disable=no-value-for-parameter
            | 'Filter out results without any collection' >> beam.Filter(
                lambda collection_ids_and_email: len(
                    collection_ids_and_email[0]) > 0
            )
        )

        return (
            collection_ids_to_email_mapping
            | 'Get final result' >> beam.MapTuple(
                lambda collection, email: job_run_result.JobRunResult.as_stdout(
                    'collection_ids: %s, email: %s' % (collection, email)
                ))
        )


class MatchEntityTypeCollectionJob(base_jobs.JobBase):
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
                feedback_models.GeneralFeedbackThreadModel.get_all())
            | 'Extract entity_type' >> beam.Map(
                    lambda feeback_model: feeback_model.entity_type)
            | 'Match entity_type' >> beam.Filter(
                lambda entity_type: entity_type == 'collection')
        )

        return (
            feedback_model_matched_as_collection
            | 'Count the output' >> (
                job_result_transforms.CountObjectsToJobRunResult())
        )
