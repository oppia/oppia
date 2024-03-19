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
    or length of bio greater than 2000.
    """

    def run(self) -> beam.PCollection[job_run_result.JobRunResult]:
        user_pairs = (
            self.pipeline
            | 'Get all UserSettingsModels' >> (
                ndb_io.GetModels(user_models.UserSettingsModel.get_all()))
            | 'Extract user id and bio from model' >> beam.Map(
                lambda user_setting: (
                    user_setting.id, user_setting.user_bio))
        )

        user_with_invalid_bio = (
            user_pairs
            | 'Get users with null bio or length of bio greater than 2000' >>
                beam.Filter(
                lambda user_pair:
                    not isinstance(user_pair[1], str)
                    or len(user_pair[1]) > 2000)
        )

        report_number_of_users_queried = (
            user_pairs
            | 'Report count of user models' >> (
                job_result_transforms.CountObjectsToJobRunResult('USERS'))
        )

        report_number_of_users_with_invalid_bio = (
            user_with_invalid_bio
            | 'Report count of invalid user models' >> (
                job_result_transforms.CountObjectsToJobRunResult('INVALID'))
        )

        report_invalid_user_ids_and_bio = (
            user_with_invalid_bio
            | 'Report info on each invalid user bio' >> beam.Map(
                lambda objects: job_run_result.JobRunResult.as_stderr(
                    'The id of user is "%s" and its bio is "%s"'
                    % (objects[0], objects[1])
                ))
        )

        return (
            (
                report_number_of_users_queried,
                report_number_of_users_with_invalid_bio,
                report_invalid_user_ids_and_bio,
            )
            | 'Combine reported results' >> beam.Flatten()
        )
