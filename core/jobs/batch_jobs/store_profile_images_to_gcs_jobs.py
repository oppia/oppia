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

import webptools

from core import utils
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

(user_models,) = models.Registry.import_models([models.Names.USER])


class StoreProfilePictureToGCSJob(base_jobs.JobBase):
    """Store profile picture to GCS job."""
    def _filenames_png(self, user_model):
        """"""
        file_dict = {}
        username = user_model.username
        filename = f'user/{username}/profile_picture.png'
        profile_picture_binary = utils.convert_png_data_url_to_binary(
            user_model.profile_picture_data_url)
        file_dict = {
            'file': filename,
            'data': profile_picture_binary
        }
        return file_dict

    def _filenames_webp(self, user_model):
        """"""
        file_dict = {}
        username = user_model.username
        filename = f'user/{username}/profile_picture.webp'
        profile_picture = user_model.profile_picture_data_url
        webp_base64 = webptools.base64str2webp_base64str(
            base64str=profile_picture, image_type="png",
            option="-q 80",logging="-v")
        webp_binary = utils.convert_webp_data_url_to_binary(webp_base64)
        file_dict = {
            'file': filename,
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
                mode='wb', mime_type='image/png')
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
                mode='wb', mime_type='image/webp')
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
            | 'Map with username' >> beam.Map(lambda model: model.username)
            | 'Map with filename' >> beam.Map(
                lambda username: f'user/{username}/profile_picture.png')
            | 'Read png files from GCS' >> gcs_io.ReadFile(mode='rb')
        )
