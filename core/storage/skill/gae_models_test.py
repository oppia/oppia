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
# Unless required by applicable law or agreed  to in writing, software
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
from core import feconf
from core.domain import skill_domain
from core.domain import skill_services



MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import base_models
    from mypy_imports import skill_models

(base_models, skill_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.skill])


class SkillSnapshotContentModelTests(test_utils.GenericTestBase):
    """Test the SkillSnapshotContentModel class."""

    def test_get_deletion_policy_is_not_applicable(self) -> None:
        self.assertEqual(
            skill_models.SkillSnapshotContentModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)


class SkillModelUnitTest(test_utils.GenericTestBase):
    """Test the SkillModel class."""

    SKILL_ID = None
    USER_ID = 'user'
 
    def setUp(self):
        super(SkillModelUnitTest, self).setUp()
        self.SKILL_ID = skill_services.get_new_skill_id()
        self.skill = self.save_new_skill(
            self.SKILL_ID, self.USER_ID, description='Description'
        )

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            skill_models.SkillModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)
    
    def test_get_merged_skills(self):
        skill = skill_models.SkillModel.get_merged_skills()
        self.assertEqual(len(skill), 0)
        changelist = [
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_PROPERTY,
                'property_name': (
                    skill_domain.SKILL_PROPERTY_SUPERSEDING_SKILL_ID),
                'old_value': '',
                'new_value': 'TestingSkillMerge'
            })
        ]
        skill_services.update_skill(
            self.USER_ID, self.SKILL_ID, changelist,
            'Merging skill.')
        skill_ids = skill_services.get_merged_skill_ids()
        self.assertEqual(len(skill_ids), 1)
        self.assertEqual(skill_ids[0], self.SKILL_ID)
    
    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            skill_models.SkillModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )
    
    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'all_questions_merged': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'description': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE, 
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE, 
            'misconceptions': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'misconceptions_schema_version':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'prerequisite_skill_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'rubric_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'rubrics': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'skill_contents': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'skill_contents_schema_version':
                base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'next_misconception_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'superseding_skill_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            skill_models.SkillModel.get_export_policy(),
            expected_export_policy_dict)


    def test_get_by_description(self) -> None:
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        skill = skill_domain.Skill.create_default_skill('skill_id', 'description', rubrics)
        skill_services.save_new_skill('test_comitter_id', skill)
        skill_model = skill_models.SkillModel.get_by_description('description')
        assert skill_model is not None
        self.assertEqual(skill_model.description, 'description')
        self.assertEqual(skill_model.id, 'skill_id')


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
    
    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            skill_models.SkillCommitLogEntryModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER)

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'commit_cmds': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'commit_message': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'commit_type': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'post_commit_community_owned': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'post_commit_is_private': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'post_commit_status': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'skill_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'user_id': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            skill_models.SkillCommitLogEntryModel
                .get_export_policy(),
            expected_export_policy_dict)


class SkillSummaryModelUnitTest(test_utils.GenericTestBase):
    """Test the SkillSummaryModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            skill_models.SkillSummaryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE
        )
    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            skill_models.SkillSummaryModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )
    
    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'description': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'misconception_count': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'worked_examples_count': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'language_code': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'skill_model_last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'skill_model_created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'version': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }

        self.assertEqual(
            skill_models.SkillSummaryModel
                .get_export_policy(),
            expected_export_policy_dict
        )

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
