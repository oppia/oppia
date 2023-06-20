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

"""Store user profile picture to GCS."""

from __future__ import annotations

import io
import logging

from core import utils
from core.domain import user_services
from core.jobs import base_jobs
from core.jobs.io import gcs_io
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

from PIL import Image
import apache_beam as beam

from typing import Tuple

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import app_identity_services
    from mypy_imports import storage_services
    from mypy_imports import user_models

storage_services = models.Registry.import_storage_services()
app_identity_services = models.Registry.import_app_identity_services()

BUCKET = app_identity_services.get_gcs_resource_bucket_name()

(user_models,) = models.Registry.import_models([models.Names.USER])


class StoreProfilePictureToGCSJob(base_jobs.JobBase):
    """Store profile picture to GCS job."""

    @staticmethod
    def _generate_png_file_object(
        user_model: user_models.UserSettingsModel
    ) -> gcs_io.FileObjectDict:
        """Returns file object for png images to write to the GCS.

        Args:
            user_model: UserSettingsModel. The user settings model.

        Returns:
            file_dict: gcs_io.FileObjectDict. The FileObjectDict containing
            filepath and data.
        """
        username = user_model.username
        filepath = f'user/{username}/assets/profile_picture.png'
        profile_picture_binary = utils.convert_data_url_to_binary(
            user_model.profile_picture_data_url, 'png')
        file_dict: gcs_io.FileObjectDict = {
            'filepath': filepath,
            'data': profile_picture_binary
        }
        return file_dict

    @staticmethod
    def _generate_webp_file_object(
        user_model: user_models.UserSettingsModel
    ) -> gcs_io.FileObjectDict:
        """Returns file object for webp images to write to the GCS.

        Args:
            user_model: UserSettingsModel. The user settings model.

        Returns:
            file_dict: gcs_io.FileObjectDict. The FileObjectDict containing
            filepath and data.
        """
        username = user_model.username
        filepath = f'user/{username}/assets/profile_picture.webp'
        profile_picture_binary = utils.convert_data_url_to_binary(
            user_model.profile_picture_data_url, 'png')
        output = io.BytesIO()
        image = Image.open(io.BytesIO(profile_picture_binary)).convert('RGB')
        image.save(output, 'webp')
        webp_binary = output.getvalue()
        file_dict: gcs_io.FileObjectDict = {
            'filepath': filepath,
            'data': webp_binary
        }
        return file_dict

    def _make_profile_picture_valid(
        self, user_model: user_models.UserSettingsModel
    ) -> user_models.UserSettingsModel:
        """Generate gravatar for users that have profile picture None.

        Args:
            user_model: user_models.UserSettingsModel. The user model.

        Returns:
            user_model: user_models.UserSettingsModel. The updated user model.
        """
        profile_picture = user_model.profile_picture_data_url
        if profile_picture is None:
            user_model.profile_picture_data_url = (
                user_services.fetch_gravatar(user_model.email))
        return user_model

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        users_with_valid_username = (
            self.pipeline
            | 'Get all non-deleted UserSettingsModel' >> ndb_io.GetModels(
                user_models.UserSettingsModel.get_all(include_deleted=False))
            | 'Filter valid users with not None username' >> beam.Filter(
                lambda model: model.username is not None)
            | 'Make the invalid profile picture valid' >> beam.Map(
                self._make_profile_picture_valid)
        )

        write_png_files_to_gcs = (
            users_with_valid_username
            | 'Map files for png' >> beam.Map(self._generate_png_file_object)
            | 'Write png file to GCS' >> gcs_io.WriteFile(mime_type='image/png')
        )

        total_png_images = (
            write_png_files_to_gcs
            | 'Total png images wrote to GCS' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'TOTAL PNG IMAGES'))
        )

        write_webp_files_to_gcs = (
            users_with_valid_username
            | 'Map files for webp' >> beam.Map(self._generate_webp_file_object)
            | 'Write webp file to GCS' >> gcs_io.WriteFile(
                mime_type='image/webp')
        )

        total_webp_images = (
            write_webp_files_to_gcs
            | 'Total webp images wrote to GCS' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'TOTAL WEBP IMAGES'))
        )

        unused_put_results = (
            users_with_valid_username
            | 'Updating the datastore with valid profile images'
            >> ndb_io.PutModels()
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

    def _png_base64_to_webp_base64(self, png_base64: str) -> str:
        """Convert png base64 to webp base64.

        Args:
            png_base64: str. The png base64 string.

        Returns:
            str. The webp base64 string.
        """
        png_binary = utils.convert_data_url_to_binary(png_base64, 'png')
        output = io.BytesIO()
        image = Image.open(io.BytesIO(png_binary)).convert('RGB')
        image.save(output, 'webp')
        webp_binary = output.getvalue()
        return utils.convert_image_binary_to_data_url(webp_binary, 'webp')

    def _check_profile_pictures_on_gcs(
        self, user_model: user_models.UserSettingsModel
    ) -> Tuple[bool, str, str]:
        """Check whether the users with valid username and None stored in
        the profile_picture_data_url field have valid profile-pictures
        stored on GCS.

        Args:
            user_model: user_models.UserSettingsModel. The user model.

        Returns:
            Tuple[bool, str, str]. The tuple containing bool, str and str values
            where bool represent that if the images are stored on GCS,
            the first str represent the error or success logs and second
            str is the username of the user.
        """
        try:
            filepath_png = (
                f'user/{user_model.username}/assets/profile_picture.png')
            filepath_webp = (
                f'user/{user_model.username}/assets/profile_picture.webp')
            unused_gcs_png_image = storage_services.get(BUCKET, filepath_png)
            unused_gcs_webp_image = storage_services.get(BUCKET, filepath_webp)
            return (
                True,
                'Both versions of image are available on GCS.',
                user_model.username
            )
        except Exception as e:
            logging.exception('Error accessing images -- ', exc_info=e)
            return (
                False, 'Images are not available on GCS', user_model.username
            )

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        users_with_valid_username = (
            self.pipeline
            | 'Get all non-deleted UserSettingsModel' >> ndb_io.GetModels(
                user_models.UserSettingsModel.get_all(include_deleted=False))
            | 'Filter valid users with not None username' >> beam.Filter(
                lambda model: model.username is not None)
        )

        users_without_profile_data_in_models = (
            users_with_valid_username
            | 'Filter users with None profile-pictures' >> beam.Filter(
                lambda model: model.profile_picture_data_url is None)
            | 'Check if profile-pictures are present on GCS' >> beam.Map(
                self._check_profile_pictures_on_gcs)
        )

        report_users_with_profiles_on_gcs = (
            users_without_profile_data_in_models
            | 'Filter users having profile pictures stored on GCS'
            >> beam.Filter(lambda data: data[0] is True)
            | 'Report the count of users with profile-pics on GCS'
            >> job_result_transforms.CountObjectsToJobRunResult(
                'USERS WITH NONE PROFILE PICTURES ON MODEL BUT VALID ON GCS')
        )

        report_users_with_profiles_not_on_gcs = (
            users_without_profile_data_in_models
            | 'Filter users with profile pictures not stored on GCS'
            >> beam.Filter(lambda data: data[0] is False)
            | 'Report the errors occur while accessing profile-pics on GCS'
            >> beam.Map(lambda data: (
                job_run_result.JobRunResult.as_stderr(
                    'The user having username %s, have the following error log '
                    '-- %s' % (data[2], data[1])
                )
            ))
        )

        username_with_profile_data = (
            users_with_valid_username
            | 'Filter users with not None profile-pictures' >> beam.Filter(
                lambda model: model.profile_picture_data_url is not None)
            | 'Map username and data url' >> beam.Map(
                lambda model: (
                    model.username,
                    model.profile_picture_data_url.replace(
                        '%2B', '+').replace('%3D', '=').replace('%0A', '')))
        )

        # Audit png images.
        audit_png_profile_pictures = (
            users_with_valid_username
            | 'Filter users with not None profile-pictures -- png'
            >> beam.Filter(
                lambda model: model.profile_picture_data_url is not None)
            | 'Map with username for png' >> beam.Map(
                lambda model: model.username)
            | 'Map with filename for png' >> beam.Map(
                lambda username: f'user/{username}/assets/profile_picture.png')
            | 'Read png files from GCS' >> gcs_io.ReadFile()
            | 'Filter the results with OK status png' >> beam.Filter(
                lambda result: result.is_ok())
            | 'Unwrap the png data' >> beam.Map(lambda result: result.unwrap())
            | 'Make tuple of username and data url for png' >> beam.Map(
                lambda data: (
                    data[0].split('/')[1],
                    utils.convert_image_binary_to_data_url(
                        data[1], 'png').replace('%2B', '+').replace(
                            '%3D', '=').replace('%0A', '')))
        )

        mismatched_png_images_on_gcs_and_model = (
            {
                'gcs_picture': audit_png_profile_pictures,
                'model_picture': username_with_profile_data
            }
            | 'Merge models for png' >> beam.CoGroupByKey()
            | 'Filter invalid png images' >> beam.Filter(
                lambda object_image: (
                    object_image[1]['gcs_picture'] !=
                    object_image[1]['model_picture'])
            )
        )

        report_mismatched_png_images_on_gcs_and_model = (
            mismatched_png_images_on_gcs_and_model
            | 'Report the png data' >> beam.Map(lambda data: (
                job_run_result.JobRunResult.as_stderr(
                    'The user having username %s, have mismatched png image on '
                    'GCS and in the model.' % (data[0])
                )
            ))
        )

        total_mismatched_png_images = (
            mismatched_png_images_on_gcs_and_model
            | 'Total number of mismatched png images' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'TOTAL MISMATCHED PNG IMAGES'))
        )

        png_images_iterated_on_gcs = (
            audit_png_profile_pictures
            | 'Total number of png images iterated' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'TOTAL PNG IMAGES ITERATED ON GCS'))
        )

        # Audit webp images.
        audit_webp_profile_pictures = (
            users_with_valid_username
            | 'Filter users with not None profile-pictures -- webp'
            >> beam.Filter(
                lambda model: model.profile_picture_data_url is not None)
            | 'Map with username for webp' >> beam.Map(
                lambda model: model.username)
            | 'Map with filename for webp' >> beam.Map(
                lambda username: f'user/{username}/assets/profile_picture.webp')
            | 'Read webp files from GCS' >> gcs_io.ReadFile()
            | 'Filter the results with OK status webp' >> beam.Filter(
                lambda result: result.is_ok())
            | 'Unwrap the webp data' >> beam.Map(lambda result: result.unwrap())
            | 'Make tuple of username and data url for webp' >> beam.Map(
                lambda data: (
                    data[0].split('/')[1],
                    utils.convert_image_binary_to_data_url(data[1], 'webp'))
            )
        )

        username_with_profile_data_webp = (
            username_with_profile_data
            | 'Convert to webp base64 string' >> beam.Map(
                lambda data: (
                    data[0], self._png_base64_to_webp_base64(data[1])))
        )

        mismatched_webp_images_on_gcs_and_model = (
            {
                'gcs_picture': audit_webp_profile_pictures,
                'model_picture': username_with_profile_data_webp
            }
            | 'Merge models for webp' >> beam.CoGroupByKey()
            | 'Filter invalid webp images' >> beam.Filter(
                lambda object_image: (
                    object_image[1]['gcs_picture'] !=
                    object_image[1]['model_picture'])
            )
        )

        report_mismatched_webp_images_on_gcs_and_model = (
            mismatched_webp_images_on_gcs_and_model
            | 'Report the webp data' >> beam.Map(lambda data: (
                job_run_result.JobRunResult.as_stderr(
                    'The user having username %s, has incompatible webp image '
                    'on GCS and png in the model.' % (data[0])
                )
            ))
        )

        total_mismatched_webp_images = (
            mismatched_webp_images_on_gcs_and_model
            | 'Total number of mismatched webp images' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'TOTAL MISMATCHED WEBP IMAGES'))
        )

        webp_images_iterated_on_gcs = (
            audit_webp_profile_pictures
            | 'Total number of webp images iterated' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'TOTAL WEBP IMAGES ITERATED ON GCS'))
        )

        return (
            (
                report_users_with_profiles_on_gcs,
                report_users_with_profiles_not_on_gcs,
                report_mismatched_png_images_on_gcs_and_model,
                total_mismatched_png_images,
                png_images_iterated_on_gcs,
                report_mismatched_webp_images_on_gcs_and_model,
                total_mismatched_webp_images,
                webp_images_iterated_on_gcs
            )
            | 'Combine results' >> beam.Flatten()
        )
