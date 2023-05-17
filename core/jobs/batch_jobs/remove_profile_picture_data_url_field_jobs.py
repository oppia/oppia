# coding: utf-8
#
# Copyright 2022 The Oppia Authors. All Rights Reserved.
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

"""Remove profile_picture_data_url field from UserSettingsModel."""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import user_models

(user_models,) = models.Registry.import_models([models.Names.USER])


class RemoveProfilePictureFieldJob(base_jobs.JobBase):
    """Remove profile_picture_data_url from UserSettingsModel."""

    def _remove_profile_field(
        self, user_model: user_models.UserSettingsModel
    ) -> user_models.UserSettingsModel:
        """Remove profile_picture_data_url field from the model.

        Args:
            user_model: UserSettingsModel. The user settings model.

        Returns:
            user_model: UserSettingsModel. The updated user settings model.
        """
        if 'profile_picture_data_url' in user_model._properties:  # pylint: disable=protected-access
            del user_model._properties['profile_picture_data_url']  # pylint: disable=protected-access
        return user_model

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        users_with_updated_fields = (
            self.pipeline
            | 'Get all non-deleted UserSettingsModel' >> ndb_io.GetModels(
                user_models.UserSettingsModel.get_all(include_deleted=True))
            | 'Remove the profile_picture_data_url field' >> beam.Map(
                self._remove_profile_field)
        )

        count_user_models_updated = (
            users_with_updated_fields
            | 'Total count for user models' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'USER MODELS ITERATED OR UPDATED'))
        )

        unused_put_results = (
            users_with_updated_fields
            | 'Put models into the datastore' >> ndb_io.PutModels()
        )

        return count_user_models_updated
