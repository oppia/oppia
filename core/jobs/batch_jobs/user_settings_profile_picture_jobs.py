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

"""Jobs for UserSettingsModel profile picture."""

from __future__ import annotations

import base64
import io
import logging

from core.domain import user_services
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

from PIL import Image
import apache_beam as beam
from typing import List, Optional

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import user_models

(user_models,) = models.Registry.import_models([models.Names.USER])


class AuditInvalidProfilePictureJob(base_jobs.JobBase):
    """Audit job to fetch invalid images from UserSettingsModel."""

    def _get_invalid_image(
        self, picture_str: Optional[str]
    ) -> Optional[List[str]]:
        """Helper function to filter the invalid profile pictures.

        Args:
            picture_str: Optional[str]. The profile picture data.

        Returns:
            Optional[List[str]]. None, if the image is valid otherwise
            the invalid image data.
        """
        invalid_image = []
        try:
            # Ruling out the possibility of different types for
            # mypy type checking.
            assert isinstance(picture_str, str)
            imgdata = base64.b64decode(picture_str)
            image = Image.open(io.BytesIO(imgdata))
            width, height = image.size
            if width != 150 and height != 150:
                invalid_image.append(
                    f'wrong dimensions - height = {height} and width = %{width}'
                )
        except Exception:
            logging.exception('ERRORED EXCEPTION AUDIT')
            invalid_image.append(
                f'Image is not base64 having value - {picture_str}')

        if len(invalid_image) != 0:
            return invalid_image
        return None

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        invalid_user_profile_picture = (
            self.pipeline
            | 'Get all non-deleted UserSettingsModel' >> ndb_io.GetModels(
                user_models.UserSettingsModel.get_all(include_deleted=False))
            | 'Filter valid users with not None username' >> beam.Filter(
                lambda model: model.username is not None)
            | 'Get invalid images' >> beam.Map(
                lambda model: (model.username, self._get_invalid_image(
                    model.profile_picture_data_url)))
            | 'Filter invalid images' >> beam.Filter(
                lambda model: model[1] is not None)
        )

        total_invalid_images = (
            invalid_user_profile_picture
            | 'Total number of invalid images' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'TOTAL INVALID IMAGES'))
        )

        report_invalid_images = (
            invalid_user_profile_picture
            | 'Report the data' >> beam.Map(lambda data: (
                job_run_result.JobRunResult.as_stderr(
                    f'The username is {data[0]} and the invalid image '
                    f'details are {data[1]}.'
                )
            ))
        )

        return (
            (
                total_invalid_images,
                report_invalid_images
            )
            | 'Combine results' >> beam.Flatten()
        )


class FixInvalidProfilePictureJob(base_jobs.JobBase):
    """Fix invalid profile pictures insidr UserSettingsModel."""

    def _fix_invalid_images(
        self, user_model: user_models.UserSettingsModel
    ) -> user_models.UserSettingsModel:
        """Helper function to fix the invalid images.

        Args:
            user_model: user_models.UserSettingsModel. The UserSettingsModel.

        Returns:
            user_model: user_models.UserSettingsModel. The updated
            UserSettingsModel.
        """
        profile_picture_data = user_model.profile_picture_data_url

        try:
            imgdata = base64.b64decode(profile_picture_data)
            Image.open(io.BytesIO(imgdata))
        except Exception:
            logging.exception('ERRORED EXCEPTION MIGRATION')
            user_model.profile_picture_data_url = (
                user_services.fetch_gravatar(user_model.email))

        return user_model

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        fixed_user_profile_picture = (
            self.pipeline
            | 'Get all non-deleted UserSettingsModel' >> ndb_io.GetModels(
                user_models.UserSettingsModel.get_all(include_deleted=False))
            | 'Filter user with valid usernames' >> beam.Filter(
                lambda model: model.username is not None)
            | 'Get invalid images' >> beam.Map(self._fix_invalid_images)
        )

        count_user_models_iterated = (
            fixed_user_profile_picture
            | 'Total count for user models' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'USER MODELS ITERATED'))
        )

        unused_put_results = (
            fixed_user_profile_picture
            | 'Put models into the datastore' >> ndb_io.PutModels()
        )

        return count_user_models_iterated
