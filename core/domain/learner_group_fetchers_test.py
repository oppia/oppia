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

"""Tests for methods defined in learner group fetchers."""

from __future__ import annotations

from core.domain import learner_group_fetchers
from core.domain import learner_group_services

from core.platform import models
from core.tests import test_utils

(learner_group_models,) = models.Registry.import_models(
    [models.NAMES.learner_group])


class LearnerGroupFetchersUnitTests(test_utils.GenericTestBase):
    """Tests for skill fetchers."""

    LEARNER_GROUP_ID = None
    FACILITATOR_ID = 'facilitator_user_1'
    STUDENT_ID = 'student_user_1'

    def setUp(self):
        super(LearnerGroupFetchersUnitTests, self).setUp()

        self.LEARNER_GROUP_ID = (
            learner_group_fetchers.get_new_learner_group_id()
        )

        self.learner_group = learner_group_services.create_learner_group(
            self.LEARNER_GROUP_ID, 'Learner Group Name', 'Description',
            [self.FACILITATOR_ID], [], [self.STUDENT_ID], ['subtopic_id_1'],
            ['story_id_1'])

    def test_get_new_learner_group_id(self):
        self.assertIsNotNone(learner_group_fetchers.get_new_learner_group_id())

    def test_get_learner_group_by_id(self):
        fake_learner_group_id = 'fake_learner_group_id'
        fake_learner_group = learner_group_fetchers.get_learner_group_by_id(
            fake_learner_group_id)
        self.assertIsNone(fake_learner_group)

        learner_group = learner_group_fetchers.get_learner_group_by_id(
            self.LEARNER_GROUP_ID
        )
        self.assertIsNotNone(learner_group)
        self.assertEqual(learner_group.group_id, self.LEARNER_GROUP_ID)

    def test_get_learner_groups_of_facilitator(self):
        fake_facilitator_id = 'fake_facilitator_id'
        fake_learner_groups = (
            learner_group_fetchers.get_learner_groups_of_facilitator(
                fake_facilitator_id
            )
        )
        self.assertEqual(len(fake_learner_groups), 0)

        learner_groups = (
            learner_group_fetchers.get_learner_groups_of_facilitator(
                self.FACILITATOR_ID
            )
        )
        self.assertEqual(len(learner_groups), 1)
        self.assertEqual(learner_groups[0].group_id, self.LEARNER_GROUP_ID)

    def test_get_progress_sharing_permission(self):
        learner_group_services.add_student_to_learner_group(
            self.STUDENT_ID, self.LEARNER_GROUP_ID, True)

        self.assertEqual(
            learner_group_fetchers.get_progress_sharing_permission(
                self.STUDENT_ID, self.LEARNER_GROUP_ID
            ), True)

        self.assertEqual(
            learner_group_fetchers.get_progress_sharing_permission(
                self.STUDENT_ID, 'fake_learner_group_id'
            ), False)
