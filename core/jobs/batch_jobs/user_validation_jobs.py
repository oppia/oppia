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

"""Validation Jobs for user models."""

from __future__ import annotations

from core.jobs import base_jobs
from core.jobs.io import ndb_io
from core.jobs.transforms import job_result_transforms
from core.jobs.types import job_run_result
from core.platform import models

import apache_beam as beam

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import user_models

(user_models,) = models.Registry.import_models([models.Names.USER])


class GetUsersWithInvalidBioJob(base_jobs.JobBase):
    """Validates that no user has a null bio
    or a bio with length greater than 2000.
    """

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        user_ids_and_bios = (
            self.pipeline
            | 'Get all UserSettingsModels' >> (
                ndb_io.GetModels(user_models.UserSettingsModel.get_all()))
            | 'Extract user id and bio from model' >> beam.Map(
                lambda user_settings: (
                    user_settings.id, user_settings.user_bio))
        )

        users_with_invalid_bios = (
            user_ids_and_bios
            | 'Get users with null bio or bio with length greater than 2000' >>
                beam.Filter(
                lambda user_id_and_bio:
                    not isinstance(user_id_and_bio[1], str)
                    or len(user_id_and_bio[1]) > 2000)
        )

        report_number_of_users_queried = (
            user_ids_and_bios
            | 'Report count of user models' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'CountTotalUsers'))
        )

        report_number_of_users_with_invalid_bio = (
            users_with_invalid_bios
            | 'Report count of invalid user models' >> (
                job_result_transforms.CountObjectsToJobRunResult(
                    'CountInvalidUserBios'))
        )

        report_invalid_user_ids_and_bios = (
            users_with_invalid_bios
            | 'Report info on each invalid user bio' >> beam.Map(
                lambda user_id_and_bio: job_run_result.JobRunResult.as_stderr(
                    'The id of user is "%s" and its bio is "%s"'
                    % (user_id_and_bio[0], user_id_and_bio[1])
                ))
        )

        return (
            (
                report_number_of_users_queried,
                report_number_of_users_with_invalid_bio,
                report_invalid_user_ids_and_bios,
            )
            | 'Combine reported results' >> beam.Flatten()
        )
