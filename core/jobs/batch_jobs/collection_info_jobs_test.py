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

"""Unit tests for jobs.batch_jobs.collection_info_jobs."""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.jobs import job_test_utils
from core.jobs.batch_jobs import collection_info_jobs
from core.jobs.types import job_run_result
from core.platform import models

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import collection_models

(collection_models, user_models) = models.Registry.import_models(
    [models.NAMES.collection, models.NAMES.user])
datastore_services = models.Registry.import_datastore_services()


class CountCollectionModelJobTests(job_test_utils.JobTestBase):

    JOB_CLASS = collection_info_jobs.CountCollectionModelJob

    USER_ID_1 = 'id_1'

    def test_empty_storage(self) -> None:
        self.assert_job_output_is_empty()

    def test_counts_single_collection(self) -> None:
        user = self.create_model(
            user_models.UserSettingsModel,
            id=self.USER_ID_1,
            email='some@email.com',
            roles=[feconf.ROLE_ID_COLLECTION_EDITOR]
        )
        user.update_timestamps()
        collection = self.create_model(
            collection_models.CollectionRightsModel,
            id=1,
            owner_ids=[self.USER_ID_1],
            editor_ids=[self.USER_ID_1],
            voice_artist_ids=[self.USER_ID_1],
            community_owned=False,
            status=constants.ACTIVITY_STATUS_PUBLIC,
            viewable_if_private=False,
            first_published_msec=0.2
        )
        collection.update_timestamps()
        self.put_multi([user, collection])

        self.assert_job_output_is([
            job_run_result.JobRunResult(stdout='SUCCESS: 1')
        ])
