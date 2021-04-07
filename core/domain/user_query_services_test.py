# coding: utf-8
#
# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

"""Tests for user query services."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import user_query_services
from core.platform import models
from core.tests import test_utils
import feconf

(user_models,) = models.Registry.import_models([models.NAMES.user])


class UserQueryServicesTests(test_utils.GenericTestBase):

    USER_QUERY_1_ID = 'user_query_1_id'
    USER_QUERY_2_ID = 'user_query_2_id'

    def setUp(self):
        super(UserQueryServicesTests, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_user_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        self.new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        self.user_query_model_1 = user_models.UserQueryModel(
            id=self.USER_QUERY_1_ID,
            has_not_logged_in_for_n_days=20,
            submitter_id=self.admin_user_id,
            query_status=feconf.USER_QUERY_STATUS_ARCHIVED,
        )
        self.user_query_model_1.update_timestamps()
        self.user_query_model_1.put()

        self.user_query_model_2 = user_models.UserQueryModel(
            id=self.USER_QUERY_2_ID,
            inactive_in_last_n_days=20,
            submitter_id=self.admin_user_id,
            query_status=feconf.USER_QUERY_STATUS_ARCHIVED,
            user_ids=[self.new_user_id]
        )
        self.user_query_model_2.update_timestamps()
        self.user_query_model_2.put()

    def test_get_user_query_returns_user_query(self):
        user_query = user_query_services.get_user_query(self.USER_QUERY_1_ID)

        self.assertEqual(self.user_query_model_1.id, user_query.id)
        self.assertEqual(
            self.user_query_model_1.inactive_in_last_n_days,
            user_query.params.inactive_in_last_n_days)
        self.assertEqual(
            self.user_query_model_1.has_not_logged_in_for_n_days,
            user_query.params.has_not_logged_in_for_n_days)
        self.assertEqual(
            self.user_query_model_1.created_at_least_n_exps,
            user_query.params.created_at_least_n_exps)
        self.assertEqual(
            self.user_query_model_1.created_fewer_than_n_exps,
            user_query.params.created_fewer_than_n_exps)
        self.assertEqual(
            self.user_query_model_1.edited_at_least_n_exps,
            user_query.params.edited_at_least_n_exps)
        self.assertEqual(
            self.user_query_model_1.edited_fewer_than_n_exps,
            user_query.params.edited_fewer_than_n_exps)
        self.assertEqual(
            self.user_query_model_1.submitter_id, user_query.submitter_id)
        self.assertEqual(
            self.user_query_model_1.query_status, user_query.status)
        self.assertEqual(self.user_query_model_1.user_ids, user_query.user_ids)
        self.assertEqual(
            self.user_query_model_1.sent_email_model_id,
            user_query.sent_email_model_id)
        self.assertEqual(
            self.user_query_model_1.created_on, user_query.created_on)
        self.assertEqual(
            self.user_query_model_1.deleted, user_query.deleted)

    def test_get_recent_user_queries_returns_recent_user_queries(self):
        user_queries, _ = user_query_services.get_recent_user_queries(5, None)

        self.assertEqual(self.user_query_model_1.id, user_queries[1].id)
        self.assertEqual(
            self.user_query_model_1.inactive_in_last_n_days,
            user_queries[1].params.inactive_in_last_n_days)
        self.assertEqual(
            self.user_query_model_1.query_status, user_queries[1].status)
        self.assertEqual(self.user_query_model_2.id, user_queries[0].id)
        self.assertEqual(
            self.user_query_model_2.has_not_logged_in_for_n_days,
            user_queries[0].params.has_not_logged_in_for_n_days)
        self.assertEqual(
            self.user_query_model_2.query_status, user_queries[0].status)

    def test_save_new_query_model(self):
        query_param = {
            'inactive_in_last_n_days': 10,
            'created_at_least_n_exps': 5,
            'has_not_logged_in_for_n_days': 30
        }
        user_query_id = user_query_services.save_new_user_query(
            self.admin_user_id, query_param)

        query_model = user_models.UserQueryModel.get(user_query_id)

        self.assertEqual(query_model.submitter_id, self.admin_user_id)
        self.assertEqual(
            query_model.inactive_in_last_n_days,
            query_param['inactive_in_last_n_days'])
        self.assertEqual(
            query_model.created_at_least_n_exps,
            query_param['created_at_least_n_exps'])
        self.assertEqual(
            query_model.has_not_logged_in_for_n_days,
            query_param['has_not_logged_in_for_n_days'])
        self.assertIsNone(query_model.created_fewer_than_n_exps)
        self.assertIsNone(query_model.edited_at_least_n_exps)
        self.assertIsNone(query_model.edited_fewer_than_n_exps)

    def test_archive_user_query_archives_user_query(self):
        original_user_query = (
            user_query_services.get_user_query(self.USER_QUERY_1_ID))
        user_query_services.archive_user_query(original_user_query.id)

        archived_user_query_model = (
            user_models.UserQueryModel.get_by_id(self.USER_QUERY_1_ID))
        self.assertEqual(
            archived_user_query_model.query_status,
            feconf.USER_QUERY_STATUS_ARCHIVED)
        self.assertTrue(archived_user_query_model.deleted)
