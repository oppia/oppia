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

"""Tests for the learner group services."""

from __future__ import annotations

from core import feconf
from core.domain import config_services
from core.domain import learner_group_fetchers
from core.domain import learner_group_services
from core.platform import models
from core.tests import test_utils

(learner_group_models,) = models.Registry.import_models(
    [models.NAMES.learner_group])


class LearnerGroupServicesUnitTests(test_utils.GenericTestBase):
    """Tests for skill fetchers."""

    LEARNER_GROUP_ID = None
    FACILITATOR_ID = 'facilitator_user_1'
    STUDENT_ID = 'student_user_1'

    def setUp(self):
        super(LearnerGroupServicesUnitTests, self).setUp()
        self.signup(feconf.ADMIN_EMAIL_ADDRESS, 'testsuper')
        self.admin_id = self.get_user_id_from_email(feconf.ADMIN_EMAIL_ADDRESS)

        self.LEARNER_GROUP_ID = (
            learner_group_fetchers.get_new_learner_group_id()
        )

        self.learner_group = learner_group_services.create_learner_group(
            self.LEARNER_GROUP_ID, 'Learner Group Name', 'Description',
            [self.FACILITATOR_ID], [], [self.STUDENT_ID], ['subtopic_id_1'],
            ['story_id_1'])

    def test_create_learner_group(self):
        self.assertIsNotNone(self.learner_group)
        self.assertEqual(self.learner_group.group_id, self.LEARNER_GROUP_ID)
        self.assertEqual(self.learner_group.title, 'Learner Group Name')
        self.assertEqual(self.learner_group.description, 'Description')
        self.assertEqual(
            self.learner_group.facilitator_user_ids, [self.FACILITATOR_ID])
        self.assertEqual(
            self.learner_group.invited_student_user_ids, [self.STUDENT_ID])
        self.assertEqual(
            self.learner_group.subtopic_page_ids, ['subtopic_id_1'])
        self.assertEqual(self.learner_group.story_ids, ['story_id_1'])

    def test_is_learner_group_feature_enabled(self):
        config_services.set_property(
            self.admin_id, 'learner_groups_are_enabled', True)
        self.assertTrue(
            learner_group_services.is_learner_group_feature_enabled())

        config_services.set_property(
            self.admin_id, 'learner_groups_are_enabled', False)
        self.assertFalse(
            learner_group_services.is_learner_group_feature_enabled())
