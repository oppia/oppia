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

"""Store user profile picture to GCS."""

from __future__ import annotations

import io
from PIL import Image

from core import utils
from core.domain import user_services
from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.io import gcs_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam
from typing import Optional

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import user_models

    from apache_beam.io.gcp import gcsio_test

(user_models,) = models.Registry.import_models([models.Names.USER])


class StoreProfilePictureToGCSJob(base_jobs.JobBase):
    """Store profile picture to GCS job."""

    def __init__(
        self,
        pipeline: beam.Pipeline,
        client: Optional[gcsio_test.FakeGcsClient] = None
    ) -> None:
        super().__init__(pipeline=pipeline)
        self.client = client
        self.pipeline = pipeline

    def _filenames_png(
        self, user_model: user_models.UserSettingsModel
    ) -> gcs_io.FileObjectDict:
        """Returns file object for png images to write to the GCS.

        Args:
            user_model: UserSettingsModel. The user settings model.

        Returns: file_dict. The FileObjectDict.
        """
        file_dict = {}
        username = user_model.username
        filename = f'user/{username}/profile_picture.png'
        if user_model.profile_picture_data_url is None:
            user_model.profile_picture_data_url = (
                user_services.fetch_gravatar(user_model.email))
        profile_picture_binary = utils.convert_png_or_webp_data_url_to_binary(
            user_model.profile_picture_data_url)
        file_dict = {
            'filepath': filename,
            'data': profile_picture_binary
        }
        return file_dict

    def _filenames_webp(
        self, user_model: user_models.UserSettingsModel
    ) -> gcs_io.FileObjectDict:
        """Returns file object for webp images to write to the GCS.

        Args:
            user_model: UserSettingsModel. The user settings model.

        Returns: file_dict. The FileObjectDict.
        """
        file_dict = {}
        username = user_model.username
        filename = f'user/{username}/profile_picture.webp'
        if user_model.profile_picture_data_url is None:
            user_model.profile_picture_data_url = (
                user_services.fetch_gravatar(user_model.email))
        profile_picture_binary = utils.convert_png_or_webp_data_url_to_binary(
            user_model.profile_picture_data_url)
        output = io.BytesIO()
        image = Image.open(io.BytesIO(profile_picture_binary)).convert("RGB")
        image.save(output, 'webp')
        webp_binary = output.getvalue()
        file_dict = {
            'filepath': filename,
            'data': webp_binary
        }
        return file_dict

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        users_with_valid_username = (
            self.pipeline
            | 'Get all non-deleted UserSettingsModel' >> ndb_io.GetModels(
                user_models.UserSettingsModel.get_all(include_deleted=False))
            | 'Filter valid users with not None username' >> beam.Filter(
                lambda model: model.username is not None)
        )

        write_png_files_to_gcs = (
            users_with_valid_username
            | 'Map files for png' >> beam.Map(self._filenames_png)
            | 'Write png file to GCS' >> gcs_io.WriteFile(
                client=self.client, mode_is_binary=True, mime_type='image/png')
        )

        total_png_images = (
            write_png_files_to_gcs
            | 'Total png images wrote to GCS' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'TOTAL PNG IMAGES'))
        )

        write_webp_files_to_gcs = (
            users_with_valid_username
            | 'Map files for webp' >> beam.Map(self._filenames_webp)
            | 'Write webp file to GCS' >> gcs_io.WriteFile(
                client=self.client, mode_is_binary=True, mime_type='image/webp')
        )

        total_webp_images = (
            write_webp_files_to_gcs
            | 'Total webp images wrote to GCS' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'TOTAL WEBP IMAGES'))
        )

        return (
            (
                total_png_images,
                total_webp_images
            )
            | 'Combine results' >> beam.Flatten()
        )


class AuditProfilePictureFromGCSJob(base_jobs.JobBase):
    """Audit profile pictures are present in GCS."""

    def __init__(
        self,
        pipeline: beam.Pipeline,
        client: Optional[gcsio_test.FakeGcsClient] = None
    ) -> None:
        super().__init__(pipeline=pipeline)
        self.client = client
        self.pipeline = pipeline

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        users_with_valid_username = (
            self.pipeline
            | 'Get all non-deleted UserSettingsModel' >> ndb_io.GetModels(
                user_models.UserSettingsModel.get_all(include_deleted=False))
            | 'Filter valid users with not None username' >> beam.Filter(
                lambda model: model.username is not None)
        )

        audit_png_profile_pictures = (
            users_with_valid_username
            | 'Map with username for png' >> beam.Map(
                lambda model: model.username)
            | 'Map with filename for png' >> beam.Map(
                lambda username: f'user/{username}/profile_picture.png')
            | 'Read png files from GCS' >> gcs_io.ReadFile(
                client=self.client, mode_is_binary=True)
            | 'Make tuple of username and data url' >> beam.Map(
                lambda data: (data[0].split('/')[1],
                utils.convert_png_binary_to_data_url(data[1]))
            )
        )

        username_with_profile_data = (
            users_with_valid_username
            | 'map username and data url' >> beam.Map(
                lambda model: (model.username, model.profile_picture_data_url))
        )

        mismatched_images_on_gcs_and_model = (
            {
                'gcs_picture': audit_png_profile_pictures,
                'model_picture': username_with_profile_data
            }
            | 'Merge models' >> beam.CoGroupByKey()
            | 'Filter invalid images' >> beam.Filter(
                lambda object: (
                    object[1]['gcs_picture'] != object[1]['model_picture']))
        )

        report_mismatched_images_on_gcs_and_model = (
            mismatched_images_on_gcs_and_model
            | 'Report the data' >> beam.Map(lambda data: (
                job_run_result.JobRunResult.as_stdout(
                    'The user having username %s, have mismatched data on '
                    'GCS and in the model. The data on GCS is %s and the '
                    'data in model is %s' % (
                        data[0], data[1]['gcs_picture'][0],
                        data[1]['model_picture'][0])
                )
            ))
        )

        total_mismatched_images = (
            mismatched_images_on_gcs_and_model
            | 'Total number of mismatched images' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'TOTAL MISMATCHED IMAGES'))
        )

        images_iterated_on_gcs = (
            audit_png_profile_pictures
            | 'Total number of images iterated' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'TOTAL IMAGES ITERATED ON GCS'))
        )

        return (
            (
                report_mismatched_images_on_gcs_and_model,
                total_mismatched_images,
                images_iterated_on_gcs
            )
            | 'Combine results' >> beam.Flatten()
        )
