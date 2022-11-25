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

"""Unit tests for the cloud_datastore_services.py"""

from __future__ import annotations

import datetime
import logging

from core import feconf
from core.platform import models
from core.platform.datastore import cloud_datastore_services
from core.tests import test_utils

from google.cloud import ndb

from typing import Sequence, Tuple

MYPY = False
if MYPY:
    from mypy_imports import datastore_services
    from mypy_imports import user_models

(user_models,) = models.Registry.import_models([models.Names.USER])
datastore_services = models.Registry.import_datastore_services()


class CloudDatastoreServicesTests(test_utils.GenericTestBase):
    """Unit tests for the cloud_datastore_services.py"""

    THREE_WEEKS = datetime.timedelta(weeks=3)

    def setUp(self) -> None:
        super().setUp()
        self.signup(self.CURRICULUM_ADMIN_EMAIL, self.CURRICULUM_ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.CURRICULUM_ADMIN_EMAIL)
        self.set_curriculum_admins([self.CURRICULUM_ADMIN_USERNAME])

        self.login(self.CURRICULUM_ADMIN_EMAIL, is_super_admin=True)
        self.admin_user_id = self.get_user_id_from_email(
            self.CURRICULUM_ADMIN_EMAIL)
        self.curr_time = datetime.datetime.utcnow()
        self.completed_activities_model = user_models.CompletedActivitiesModel(
            id=self.admin_user_id,
            exploration_ids=[],
            collection_ids=[],
            story_ids=[],
            learnt_topic_ids=[],
            last_updated=self.curr_time
        )
        self.user_query_model = user_models.UserQueryModel(
            id='query_id',
            user_ids=[],
            submitter_id=self.admin_user_id,
            query_status=feconf.USER_QUERY_STATUS_PROCESSING,
            last_updated=self.curr_time
        )

    def test_update_timestamps_multi(self) -> None:
        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(self.admin_user_id))
        self.assertIsNone(user_models.UserQueryModel.get_by_id('query_id'))

        cloud_datastore_services.update_timestamps_multi(
            [self.completed_activities_model, self.user_query_model], False)
        cloud_datastore_services.put_multi(
            [self.completed_activities_model, self.user_query_model])

        self.assertIsNotNone(
            user_models.CompletedActivitiesModel.get_by_id(self.admin_user_id))
        self.assertIsNotNone(user_models.UserQueryModel.get_by_id('query_id'))

        self.assertEqual(
            self.completed_activities_model.get_by_id(
                self.admin_user_id).last_updated,
            self.curr_time)
        self.assertEqual(
            self.user_query_model.get_by_id('query_id').last_updated,
            self.curr_time)

    def test_delete_multi_transactional(self) -> None:
        cloud_datastore_services.update_timestamps_multi(
            [self.completed_activities_model, self.user_query_model], False)
        cloud_datastore_services.put_multi(
            [self.completed_activities_model, self.user_query_model])

        self.assertIsNotNone(
            user_models.CompletedActivitiesModel.get_by_id(self.admin_user_id))
        self.assertIsNotNone(user_models.UserQueryModel.get_by_id('query_id'))

        cloud_datastore_services.delete_multi_transactional([
            datastore_services.Key(
                user_models.CompletedActivitiesModel, self.admin_user_id),
            datastore_services.Key(user_models.UserQueryModel, 'query_id')
        ])

        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(self.admin_user_id))
        self.assertIsNone(user_models.UserQueryModel.get_by_id('query_id'))

    def test_fetch_multiple_entities_by_ids_and_models(self) -> None:
        cloud_datastore_services.update_timestamps_multi(
            [self.completed_activities_model, self.user_query_model], False)
        cloud_datastore_services.put_multi(
            [self.completed_activities_model, self.user_query_model])

        returned_models = (
            cloud_datastore_services.fetch_multiple_entities_by_ids_and_models(
            [
                ('CompletedActivitiesModel', [self.admin_user_id]),
                ('UserQueryModel', ['query_id'])
            ])
        )

        self.assertEqual(
            returned_models,
            [[self.completed_activities_model], [self.user_query_model]])

    def test_fetch_multiple_entities_throws_error_on_duplicate_parameters(
            self) -> None:
        cloud_datastore_services.update_timestamps_multi(
            [self.completed_activities_model, self.user_query_model], False)
        cloud_datastore_services.put_multi(
            [self.completed_activities_model, self.user_query_model])

        error_msg = 'Model names should not be duplicated in input list.'
        with self.assertRaisesRegex(Exception, error_msg):
            cloud_datastore_services.fetch_multiple_entities_by_ids_and_models(
                [
                    ('UserQueryModel', ['query_id']),
                    ('UserQueryModel', ['query_id'])
                ]
            )

    def test_get_multi_throws_error_on_failure(
        self
    ) -> None:
        observed_log_messages = []

        def _mock_logging_function(msg: str, *args: str) -> None:

            """Mocks logging.exception()."""
            observed_log_messages.append(msg % args)
        dummy_keys = [
            ndb.Key('model1', 'id1'),
            ndb.Key('model2', 'id2'),
            ndb.Key('model3', 'id3')
        ]
        error_msg = (
            'get_multi failed after %s retries' %
            cloud_datastore_services.MAX_GET_RETRIES
        )
        with self.swap_to_always_raise(
            ndb,
            'get_multi',
            Exception('Mock key error')
        ), self.swap(logging, 'exception', _mock_logging_function):
            with self.assertRaisesRegex(Exception, error_msg):
                cloud_datastore_services.get_multi(dummy_keys)
        self.assertEqual(
            observed_log_messages,
            ['Exception raised: Mock key error',
            'Exception raised: Mock key error',
            'Exception raised: Mock key error']
        )

    def test_ndb_query_with_filters(self) -> None:
        user_query_model1 = user_models.UserQueryModel(
            id='query_id1',
            user_ids=[],
            submitter_id=self.admin_user_id,
            query_status=feconf.USER_QUERY_STATUS_PROCESSING,
            last_updated=self.curr_time - self.THREE_WEEKS
        )
        user_query_model2 = user_models.UserQueryModel(
            id='query_id2',
            user_ids=[],
            submitter_id=self.admin_user_id,
            query_status=feconf.USER_QUERY_STATUS_COMPLETED,
            last_updated=self.curr_time
        )
        cloud_datastore_services.update_timestamps_multi(
            [user_query_model1, user_query_model2], False)
        cloud_datastore_services.put_multi(
            [user_query_model1, user_query_model2])

        result = user_models.UserQueryModel.query(
            cloud_datastore_services.all_of(
                user_models.UserQueryModel.submitter_id == self.admin_user_id,
                user_models.UserQueryModel.query_status == (
                    feconf.USER_QUERY_STATUS_COMPLETED)
            )).get()

        self.assertEqual(result, user_query_model2)

        result = user_models.UserQueryModel.query(
            cloud_datastore_services.any_of(
                user_models.UserQueryModel.submitter_id == 'new_id',
                user_models.UserQueryModel.query_status == (
                    feconf.USER_QUERY_STATUS_PROCESSING)
            )).get()

        self.assertEqual(result, user_query_model1)

        results: Tuple[
            Sequence[cloud_datastore_services.Model],
            cloud_datastore_services.Cursor, bool
        ] = user_models.UserQueryModel.query(
                user_models.UserQueryModel.submitter_id == self.admin_user_id,
            ).fetch_page(2, cloud_datastore_services.make_cursor())

        self.assertEqual(results[0], [user_query_model1, user_query_model2])
