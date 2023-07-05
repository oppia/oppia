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

"""Unit tests for the cron_services."""

from __future__ import annotations

import datetime

from core import feconf
from core.domain import cron_services
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY:
    from mypy_imports import user_models

(user_models,) = models.Registry.import_models([models.Names.USER])


class CronServicesTests(test_utils.GenericTestBase):
    """Unit tests for the cron_services."""

    NINE_WEEKS = datetime.timedelta(weeks=9)

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

    def test_delete_models_marked_as_deleted(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        admin_user_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)

        completed_activities_model = user_models.CompletedActivitiesModel(
            id=admin_user_id,
            exploration_ids=[],
            collection_ids=[],
            story_ids=[],
            learnt_topic_ids=[],
            last_updated=datetime.datetime.utcnow() - self.NINE_WEEKS,
            deleted=True
        )
        completed_activities_model.update_timestamps(
            update_last_updated_time=False)
        completed_activities_model.put()

        self.assertIsNotNone(
            user_models.CompletedActivitiesModel.get_by_id(admin_user_id))

        cron_services.delete_models_marked_as_deleted()

        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(admin_user_id))

    def test_mark_outdated_models_as_deleted(self) -> None:
        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        admin_user_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)

        user_query_model = user_models.UserQueryModel(
            id='query_id',
            user_ids=[],
            submitter_id=admin_user_id,
            query_status=feconf.USER_QUERY_STATUS_PROCESSING,
            last_updated=datetime.datetime.utcnow() - self.NINE_WEEKS
        )
        user_query_model.update_timestamps(update_last_updated_time=False)
        user_query_model.put()

        self.assertFalse(user_query_model.get_by_id('query_id').deleted)

        cron_services.mark_outdated_models_as_deleted()

        self.assertTrue(user_query_model.get_by_id('query_id').deleted)
