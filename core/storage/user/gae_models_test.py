# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

import datetime
from core.platform import models
from core.tests import test_utils

(user_models,) = models.Registry.import_models([models.NAMES.user])


class ExplorationUserDataModelTest(test_utils.GenericTestBase):
    """Tests for the ExplorationUserDataModel class."""

    DATETIME_OBJECT = datetime.datetime.strptime('2016-02-16', '%Y-%m-%d')
    USER_ID = 'user_id'
    EXP_ID_ONE = 'exp_id_one'
    EXP_ID_TWO = 'exp_id_two'

    def setUp(self):
        super(ExplorationUserDataModelTest, self).setUp()
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.USER_ID, self.EXP_ID_ONE), user_id=self.USER_ID,
            exploration_id=self.EXP_ID_ONE, rating=2,
            rated_on=self.DATETIME_OBJECT,
            draft_change_list={'new_content': {}},
            draft_change_list_last_updated=self.DATETIME_OBJECT,
            draft_change_list_exp_version=3).put()

    def test_create_success(self):
        user_models.ExplorationUserDataModel.create(
            self.USER_ID, self.EXP_ID_TWO).put()
        retrieved_object = user_models.ExplorationUserDataModel.get_by_id(
            '%s.%s' % (self.USER_ID, self.EXP_ID_TWO))

        self.assertEqual(retrieved_object.user_id, self.USER_ID)
        self.assertEqual(retrieved_object.exploration_id, self.EXP_ID_TWO)

    def test_get_success(self):
        retrieved_object = user_models.ExplorationUserDataModel.get(
            self.USER_ID, self.EXP_ID_ONE)

        self.assertEqual(retrieved_object.user_id, self.USER_ID)
        self.assertEqual(retrieved_object.exploration_id, self.EXP_ID_ONE)
        self.assertEqual(retrieved_object.rating, 2)
        self.assertEqual(retrieved_object.rated_on, self.DATETIME_OBJECT)
        self.assertEqual(
            retrieved_object.draft_change_list, {'new_content': {}})
        self.assertEqual(retrieved_object.draft_change_list_last_updated,
                         self.DATETIME_OBJECT)
        self.assertEqual(retrieved_object.draft_change_list_exp_version, 3)

    def test_get_failure(self):
        retrieved_object = user_models.ExplorationUserDataModel.get(
            self.USER_ID, 'unknown_exp_id')

        self.assertEqual(retrieved_object, None)
