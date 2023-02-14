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

import io
import logging
import os

from core import constants
from core import utils
from core.domain import image_services
from core.domain import user_services
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

from PIL import Image
import apache_beam as beam
from typing import List, Optional, Tuple

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
            imgdata = utils.convert_data_url_to_binary(picture_str, 'png')
            image = Image.open(io.BytesIO(imgdata))
            width, height = image.size
            if width != 150 and height != 150:
                invalid_image.append(
                    f'wrong dimensions - height = {height} and width = {width}'
                )
        except Exception:
            logging.exception('ERRORED EXCEPTION AUDIT')
            invalid_image.append(
                f'Image is not base64 having value - {picture_str}')

        if len(invalid_image) != 0:
            return invalid_image
        return None

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        users_with_valid_username = (
            self.pipeline
            | 'Get all non-deleted UserSettingsModel' >> ndb_io.GetModels(
                user_models.UserSettingsModel.get_all(include_deleted=False))
            | 'Filter valid users with not None username' >> beam.Filter(
                lambda model: model.username is not None)
        )

        invalid_user_profile_picture = (
            users_with_valid_username
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

        total_user_with_valid_username = (
            users_with_valid_username
            | 'Total valid users' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'TOTAL USERS WITH VALID USERNAME'))
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
                report_invalid_images,
                total_user_with_valid_username
            )
            | 'Combine results' >> beam.Flatten()
        )


class FixInvalidProfilePictureJob(base_jobs.JobBase):
    """Fix invalid profile pictures inside UserSettingsModel."""

    def _fix_invalid_images(
        self, user_model: user_models.UserSettingsModel
    ) -> Tuple[user_models.UserSettingsModel, bool]:
        """Helper function to fix the invalid images.

        Args:
            user_model: user_models.UserSettingsModel. The UserSettingsModel.

        Returns:
            Tuple[user_models.UserSettingsModel, bool]. The tuple containing
            updated UserSettingsModel and a bool value that tells whether the
            profile picture present is the default data url or not.
        """
        profile_picture_data = user_model.profile_picture_data_url
        width, height = 0, 0

        try:
            imgdata = utils.convert_data_url_to_binary(
                profile_picture_data, 'png')
            height, width = image_services.get_image_dimensions(imgdata)
        except Exception:
            logging.exception('ERRORED EXCEPTION MIGRATION')
            user_model.profile_picture_data_url = (
                user_services.fetch_gravatar(user_model.email))

        if (
            user_model.profile_picture_data_url ==
            user_services.DEFAULT_IDENTICON_DATA_URL or (
                width == 76 and height == 76)
        ):
            default_image_path = os.path.join(
                'images', 'avatar', 'user_blue_150px.png')
            raw_image_png = constants.get_package_file_contents(
                'assets', default_image_path, binary_mode=True)
            user_model.profile_picture_data_url = (
                utils.convert_image_binary_to_data_url(
                    raw_image_png, 'png'))

        # Here we need to check for the default image again because there is a
        # possibility that in the above check we are not able to generate the
        # gravatar for the user having default image and we want to keep track
        # of all the default images.
        imgdata = utils.convert_data_url_to_binary(
            user_model.profile_picture_data_url, 'png')
        height, width = image_services.get_image_dimensions(imgdata)
        if (
            user_model.profile_picture_data_url ==
            user_services.DEFAULT_IDENTICON_DATA_URL or (
                width == 76 and height == 76)
        ):
            return (user_model, False)

        return (user_model, True)

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        fixed_user_profile_picture = (
            self.pipeline
            | 'Get all non-deleted UserSettingsModel' >> ndb_io.GetModels(
                user_models.UserSettingsModel.get_all(include_deleted=False))
            | 'Filter user with valid usernames' >> beam.Filter(
                lambda model: model.username is not None)
            | 'Get invalid images' >> beam.Map(self._fix_invalid_images)
        )

        default_profile_picture = (
            fixed_user_profile_picture
            | 'Filter default profile pictures' >> beam.Filter(
                lambda value: value[1] is False)
            | 'Total count for user models having default profile picture' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'DEFAULT PROFILE PICTURE'))
        )

        count_user_models_iterated = (
            fixed_user_profile_picture
            | 'Total count for user models' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'USER MODELS ITERATED'))
        )

        unused_put_results = (
            fixed_user_profile_picture
            | 'Map with only models' >> beam.Map(lambda value: value[0])
            | 'Put models into the datastore' >> ndb_io.PutModels()
        )

        return (
            (
                count_user_models_iterated,
                default_profile_picture
            )
            | 'Combine results' >> beam.Flatten()
        )
