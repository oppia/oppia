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

"""Tests the methods defined in skill services."""

from core.domain import skill_domain
from core.domain import skill_services
from core.domain import state_domain
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf

(skill_models,) = models.Registry.import_models([models.NAMES.skill])


class SkillServicesUnitTests(test_utils.GenericTestBase):
    """Test the skill services module."""

    SKILL_ID = None
    USER_ID = 'user'
    MISCONCEPTION_ID_1 = 1
    MISCONCEPTION_ID_2 = 2

    def setUp(self):
        super(SkillServicesUnitTests, self).setUp()
        skill_contents = skill_domain.SkillContents(
            state_domain.SubtitledHtml(
                '1', 'Explanation'), [
                    state_domain.SubtitledHtml('2', 'Example 1')], {})
        misconceptions = [skill_domain.Misconception(
            self.MISCONCEPTION_ID_1, 'name', 'description', 'default_feedback')]
        self.SKILL_ID = skill_services.get_new_skill_id()

        self.signup('a@example.com', 'A')
        self.signup(self.ADMIN_EMAIL, username=self.ADMIN_USERNAME)
        self.signup('admin2@example.com', username='adm2')

        self.user_id_a = self.get_user_id_from_email('a@example.com')
        self.user_id_admin = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.user_id_admin_2 = self.get_user_id_from_email('admin2@example.com')
        self.set_admins([self.ADMIN_USERNAME, 'adm2'])
        self.user_a = user_services.UserActionsInfo(self.user_id_a)
        self.user_admin = user_services.UserActionsInfo(self.user_id_admin)
        self.user_admin_2 = user_services.UserActionsInfo(self.user_id_admin_2)

        self.skill = self.save_new_skill(
            self.SKILL_ID, self.USER_ID, 'Description',
            misconceptions=misconceptions,
            skill_contents=skill_contents)

    def test_compute_summary(self):
        skill_summary = skill_services.compute_summary_of_skill(self.skill)

        self.assertEqual(skill_summary.id, self.SKILL_ID)
        self.assertEqual(skill_summary.description, 'Description')
        self.assertEqual(skill_summary.misconception_count, 1)
        self.assertEqual(skill_summary.worked_examples_count, 1)

    def test_get_new_skill_id(self):
        new_skill_id = skill_services.get_new_skill_id()

        self.assertEqual(len(new_skill_id), 12)
        self.assertEqual(skill_models.SkillModel.get_by_id(new_skill_id), None)

    def test_get_skill_from_model(self):
        skill_model = skill_models.SkillModel.get(self.SKILL_ID)
        skill = skill_services.get_skill_from_model(skill_model)

        self.assertEqual(skill.to_dict(), self.skill.to_dict())

    def test_get_skill_summary_from_model(self):
        skill_summary_model = skill_models.SkillSummaryModel.get(self.SKILL_ID)
        skill_summary = skill_services.get_skill_summary_from_model(
            skill_summary_model)

        self.assertEqual(skill_summary.id, self.SKILL_ID)
        self.assertEqual(skill_summary.description, 'Description')
        self.assertEqual(skill_summary.misconception_count, 1)
        self.assertEqual(skill_summary.worked_examples_count, 1)

    def test_get_all_skill_summaries(self):
        skill_summaries = skill_services.get_all_skill_summaries()

        self.assertEqual(len(skill_summaries), 1)
        self.assertEqual(skill_summaries[0].id, self.SKILL_ID)
        self.assertEqual(skill_summaries[0].description, 'Description')
        self.assertEqual(skill_summaries[0].misconception_count, 1)
        self.assertEqual(skill_summaries[0].worked_examples_count, 1)

    def test_get_skill_descriptions_by_ids(self):
        self.save_new_skill(
            'skill_2', self.USER_ID, 'Description 2', misconceptions=[],
            skill_contents=skill_domain.SkillContents(
                state_domain.SubtitledHtml(
                    '1', 'Explanation'), [
                        state_domain.SubtitledHtml('2', 'Example 1')], {}))
        self.save_new_skill(
            'skill_3', self.USER_ID, 'Description 3', misconceptions=[],
            skill_contents=skill_domain.SkillContents(
                state_domain.SubtitledHtml(
                    '1', 'Explanation'), [
                        state_domain.SubtitledHtml('2', 'Example 1')], {}))
        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            skill_descriptions = skill_services.get_skill_descriptions_by_ids(
                'topic_id', [self.SKILL_ID, 'skill_2', 'skill_3'])
            messages = self.mail_stub.get_sent_messages(
                to=feconf.ADMIN_EMAIL_ADDRESS)
            self.assertEqual(len(messages), 0)

            skill_services.delete_skill(self.USER_ID, 'skill_2')
            skill_descriptions = skill_services.get_skill_descriptions_by_ids(
                'topic_id', [self.SKILL_ID, 'skill_2', 'skill_3'])
            messages = self.mail_stub.get_sent_messages(
                to=feconf.ADMIN_EMAIL_ADDRESS)
            expected_email_html_body = (
                'The deleted skills: skill_2 are still'
                ' present in topic with id topic_id')
            self.assertEqual(len(messages), 1)
            self.assertIn(
                expected_email_html_body,
                messages[0].html.decode())
            self.assertEqual(
                skill_descriptions, {
                    self.SKILL_ID: 'Description',
                    'skill_2': None,
                    'skill_3': 'Description 3'
                }
            )

    def test_get_skill_by_id(self):
        expected_skill = self.skill.to_dict()
        skill = skill_services.get_skill_by_id(self.SKILL_ID)
        self.assertEqual(skill.to_dict(), expected_skill)

    def test_commit_log_entry(self):
        skill_commit_log_entry = (
            skill_models.SkillCommitLogEntryModel.get_commit(self.SKILL_ID, 1)
        )
        self.assertEqual(skill_commit_log_entry.commit_type, 'create')
        self.assertEqual(skill_commit_log_entry.skill_id, self.SKILL_ID)
        self.assertEqual(skill_commit_log_entry.user_id, self.USER_ID)

    def test_get_skill_summary_by_id(self):
        skill_summary = skill_services.get_skill_summary_by_id(self.SKILL_ID)

        self.assertEqual(skill_summary.id, self.SKILL_ID)
        self.assertEqual(skill_summary.description, 'Description')
        self.assertEqual(skill_summary.misconception_count, 1)

    def test_update_skill(self):
        changelist = [
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_ADD_SKILL_MISCONCEPTION,
                'new_misconception_dict': {
                    'id': 0,
                    'name': 'test name',
                    'notes': 'test notes',
                    'feedback': 'test feedback'
                }
            }),
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_MISCONCEPTIONS_PROPERTY,
                'property_name': (
                    skill_domain.SKILL_MISCONCEPTIONS_PROPERTY_NAME),
                'id': 0,
                'old_value': 'test name',
                'new_value': 'Name'
            })
        ]
        skill_services.update_skill(
            self.USER_ID, self.SKILL_ID, changelist,
            'Updated misconception name.')
        skill = skill_services.get_skill_by_id(self.SKILL_ID)
        skill_summary = skill_services.get_skill_summary_by_id(self.SKILL_ID)
        self.assertEqual(skill_summary.misconception_count, 2)
        self.assertEqual(skill_summary.version, 2)
        self.assertEqual(skill.version, 2)
        self.assertEqual(skill.misconceptions[1].name, 'Name')

    def test_merge_skill(self):
        changelist = [
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_PROPERTY,
                'property_name': (
                    skill_domain.SKILL_PROPERTY_SUPERSEDING_SKILL_ID),
                'id': 0,
                'old_value': '',
                'new_value': 'TestSkillId'
            }),
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_PROPERTY,
                'property_name': (
                    skill_domain.SKILL_PROPERTY_ALL_QUESTIONS_MERGED),
                'id': 0,
                'old_value': None,
                'new_value': False
            })
        ]
        skill_services.update_skill(
            self.USER_ID, self.SKILL_ID, changelist,
            'Merging skill.')
        skill = skill_services.get_skill_by_id(self.SKILL_ID)
        self.assertEqual(skill.version, 2)
        self.assertEqual(skill.superseding_skill_id, 'TestSkillId')
        self.assertEqual(skill.all_questions_merged, False)

    def test_set_merge_complete_for_skill(self):
        changelist = [
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_PROPERTY,
                'property_name': (
                    skill_domain.SKILL_PROPERTY_ALL_QUESTIONS_MERGED),
                'id': 0,
                'old_value': False,
                'new_value': True
            })
        ]
        skill_services.update_skill(
            self.USER_ID, self.SKILL_ID, changelist,
            'Setting merge complete for skill.')
        skill = skill_services.get_skill_by_id(self.SKILL_ID)
        self.assertEqual(skill.version, 2)
        self.assertEqual(skill.all_questions_merged, True)


    def test_get_merged_skill_ids(self):
        skill_ids = skill_services.get_merged_skill_ids()
        self.assertEqual(len(skill_ids), 0)
        changelist = [
            skill_domain.SkillChange({
                'cmd': skill_domain.CMD_UPDATE_SKILL_PROPERTY,
                'property_name': (
                    skill_domain.SKILL_PROPERTY_SUPERSEDING_SKILL_ID),
                'id': 0,
                'old_value': '',
                'new_value': 'TestSkillId'
            })
        ]
        skill_services.update_skill(
            self.USER_ID, self.SKILL_ID, changelist,
            'Merging skill.')
        skill_ids = skill_services.get_merged_skill_ids()
        self.assertEqual(len(skill_ids), 1)
        self.assertEqual(skill_ids[0], self.SKILL_ID)

    def test_delete_skill(self):
        skill_services.delete_skill(self.USER_ID, self.SKILL_ID)
        self.assertEqual(
            skill_services.get_skill_by_id(self.SKILL_ID, strict=False), None)
        self.assertEqual(
            skill_services.get_skill_summary_by_id(
                self.SKILL_ID, strict=False), None)

    def test_get_unpublished_skill_rights_by_creator(self):
        self.save_new_skill(
            'skill_a', self.user_id_admin, 'Description A', misconceptions=[],
            skill_contents=skill_domain.SkillContents(
                state_domain.SubtitledHtml(
                    '1', 'Explanation'), [
                        state_domain.SubtitledHtml('2', 'Example 1')], {}))
        self.save_new_skill(
            'skill_b', self.user_id_admin, 'Description B', misconceptions=[],
            skill_contents=skill_domain.SkillContents(
                state_domain.SubtitledHtml(
                    '1', 'Explanation'), [
                        state_domain.SubtitledHtml('2', 'Example 1')], {}))

        skill_rights = skill_services.get_unpublished_skill_rights_by_creator(
            self.user_id_admin)
        skill_ids = [skill_rights_obj.id for skill_rights_obj in skill_rights]
        self.assertListEqual(skill_ids, ['skill_a', 'skill_b'])

        skill_services.publish_skill(self.SKILL_ID, self.user_id_admin)
        skill_rights = skill_services.get_unpublished_skill_rights_by_creator(
            self.user_id_admin)
        skill_ids = [skill_rights_obj.id for skill_rights_obj in skill_rights]
        self.assertListEqual(skill_ids, ['skill_a', 'skill_b'])

    def test_get_multi_skills(self):
        self.save_new_skill(
            'skill_a', self.user_id_admin, 'Description A', misconceptions=[],
            skill_contents=skill_domain.SkillContents(
                state_domain.SubtitledHtml(
                    '1', 'Explanation'), [
                        state_domain.SubtitledHtml('2', 'Example 1')], {}))
        self.save_new_skill(
            'skill_b', self.user_id_admin, 'Description B', misconceptions=[],
            skill_contents=skill_domain.SkillContents(
                state_domain.SubtitledHtml(
                    '1', 'Explanation'), [
                        state_domain.SubtitledHtml('2', 'Example 1')], {}))
        try:
            skill_services.get_multi_skills(['skill_a', 'skill_b'])
        except Exception:
            self.fail(msg='Unexpected exception raised.')

        with self.assertRaisesRegexp(
            Exception, 'No skill exists for ID skill_c'):
            skill_services.get_multi_skills(['skill_a', 'skill_c'])


class SkillMasteryServicesUnitTests(test_utils.GenericTestBase):
    """Test the skill mastery services module."""

    SKILL_IDS = []
    USER_ID = 'user'
    DEGREE_OF_MASTERY_1 = 0.0
    DEGREE_OF_MASTERY_2 = 0.5

    def setUp(self):
        super(SkillMasteryServicesUnitTests, self).setUp()
        self.SKILL_ID_1 = skill_services.get_new_skill_id()
        self.SKILL_ID_2 = skill_services.get_new_skill_id()
        self.SKILL_IDS = [self.SKILL_ID_1, self.SKILL_ID_2]
        skill_services.create_user_skill_mastery(
            self.USER_ID, self.SKILL_ID_1, self.DEGREE_OF_MASTERY_1)
        skill_services.create_user_skill_mastery(
            self.USER_ID, self.SKILL_ID_2, self.DEGREE_OF_MASTERY_2)

    def test_get_skill_mastery(self):
        degree_of_mastery = skill_services.get_skill_mastery(
            self.USER_ID, self.SKILL_ID_1)

        self.assertEqual(degree_of_mastery, self.DEGREE_OF_MASTERY_1)

    def test_get_multi_skill_mastery(self):
        degree_of_mastery = skill_services.get_multi_skill_mastery(
            self.USER_ID, self.SKILL_IDS)

        self.assertEqual(degree_of_mastery, ([
            self.DEGREE_OF_MASTERY_1, self.DEGREE_OF_MASTERY_2]))
