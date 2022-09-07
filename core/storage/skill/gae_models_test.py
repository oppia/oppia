# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Tests for Skill models."""

from __future__ import annotations

import datetime

from core.constants import constants
from core.platform import models
from core.tests import test_utils

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import skill_models

(base_models, skill_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.SKILL
])


class SkillSnapshotContentModelTests(test_utils.GenericTestBase):

    def test_get_deletion_policy_is_not_applicable(self) -> None:
        self.assertEqual(
            skill_models.SkillSnapshotContentModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)


class SkillModelUnitTest(test_utils.GenericTestBase):
    """Test the SkillModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            skill_models.SkillModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)


class SkillCommitLogEntryModelUnitTests(test_utils.GenericTestBase):
    """Tests the SkillCommitLogEntryModel class."""

    def test_has_reference_to_user_id(self) -> None:
        commit = skill_models.SkillCommitLogEntryModel.create(
            'b', 0, 'committer_id', 'msg', 'create', [{}],
            constants.ACTIVITY_STATUS_PUBLIC, False
        )
        commit.skill_id = 'b'
        commit.update_timestamps()
        commit.put()
        self.assertTrue(
            skill_models.SkillCommitLogEntryModel
            .has_reference_to_user_id('committer_id'))
        self.assertFalse(
            skill_models.SkillCommitLogEntryModel
            .has_reference_to_user_id('x_id'))


class SkillSummaryModelUnitTest(test_utils.GenericTestBase):
    """Test the SkillSummaryModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            skill_models.SkillSummaryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_fetch_page(self) -> None:
        skill_models.SkillSummaryModel(
            id='skill_id1',
            description='description1',
            misconception_count=1,
            version=1,
            worked_examples_count=1,
            language_code='en',
            skill_model_last_updated=datetime.datetime.utcnow(),
            skill_model_created_on=datetime.datetime.utcnow()
        ).put()
        skill_models.SkillSummaryModel(
            id='skill_id2',
            description='description2',
            misconception_count=1,
            worked_examples_count=1,
            version=1,
            language_code='en',
            skill_model_last_updated=datetime.datetime.utcnow(),
            skill_model_created_on=datetime.datetime.utcnow()
        ).put()

        skill_summaries, next_cursor, more = (
            skill_models.SkillSummaryModel.fetch_page(1, None, None))
        self.assertEqual(skill_summaries[0].id, 'skill_id2')
        self.assertTrue(more)
        self.assertIsInstance(next_cursor, str)

        skill_summaries, next_cursor, more = (
            skill_models.SkillSummaryModel.fetch_page(10, None, None))
        self.assertEqual(skill_summaries[0].id, 'skill_id2')
        self.assertFalse(more)
        self.assertEqual(next_cursor, None)

        skill_summaries, next_cursor, more = (
            skill_models.SkillSummaryModel.fetch_page(
                10, None, 'Oldest Created'))
        self.assertEqual(skill_summaries[0].id, 'skill_id1')
        self.assertEqual(skill_summaries[1].id, 'skill_id2')
        self.assertFalse(more)

        skill_summaries, next_cursor, more = (
            skill_models.SkillSummaryModel.fetch_page(
                10, None, 'Most Recently Updated'))
        self.assertEqual(skill_summaries[0].id, 'skill_id2')
        self.assertEqual(skill_summaries[1].id, 'skill_id1')
        self.assertFalse(more)

        skill_summaries, next_cursor, more = (
            skill_models.SkillSummaryModel.fetch_page(
                10, None, 'Least Recently Updated'))
        self.assertEqual(skill_summaries[0].id, 'skill_id1')
        self.assertEqual(skill_summaries[1].id, 'skill_id2')
        self.assertFalse(more)
