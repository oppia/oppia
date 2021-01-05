# coding: utf-8
#
# Copyright 2020 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for core.domain.skill_validators."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from constants import constants
from core.domain import prod_validation_jobs_one_off
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import state_domain
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

datastore_services = models.Registry.import_datastore_services()

USER_EMAIL = 'useremail@example.com'
USER_NAME = 'username'

(question_models, skill_models, user_models) = models.Registry.import_models([
    models.NAMES.question, models.NAMES.skill, models.NAMES.user
])


class SkillModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(SkillModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        self.set_admins([self.ADMIN_USERNAME])

        language_codes = ['ar', 'en', 'en']
        skills = [skill_domain.Skill.create_default_skill(
            '%s' % i,
            'description %d' % i,
            rubrics
        ) for i in python_utils.RANGE(3)]

        for i in python_utils.RANGE(2):
            skill = skill_domain.Skill.create_default_skill(
                '%s' % (i + 3),
                'description %d' % (i + 3),
                rubrics)
            skill_services.save_new_skill(self.owner_id, skill)

        example_1 = skill_domain.WorkedExample(
            state_domain.SubtitledHtml('2', '<p>Example Question 1</p>'),
            state_domain.SubtitledHtml('3', '<p>Example Explanation 1</p>')
        )
        skill_contents = skill_domain.SkillContents(
            state_domain.SubtitledHtml(
                '1', '<p>Explanation</p>'), [example_1],
            state_domain.RecordedVoiceovers.from_dict({
                'voiceovers_mapping': {
                    '1': {}, '2': {}, '3': {}
                }
            }),
            state_domain.WrittenTranslations.from_dict({
                'translations_mapping': {
                    '1': {}, '2': {}, '3': {}
                }
            })
        )
        misconception_dict = {
            'id': 0, 'name': 'name', 'notes': '<p>notes</p>',
            'feedback': '<p>default_feedback</p>',
            'must_be_addressed': True}

        misconception = skill_domain.Misconception.from_dict(
            misconception_dict)

        for index, skill in enumerate(skills):
            skill.language_code = language_codes[index]
            skill.skill_contents = skill_contents
            skill.add_misconception(misconception)
            if index < 2:
                skill.superseding_skill_id = '%s' % (index + 3)
                skill.all_questions_merged = True
            skill_services.save_new_skill(self.owner_id, skill)

        self.model_instance_0 = skill_models.SkillModel.get_by_id('0')
        self.model_instance_1 = skill_models.SkillModel.get_by_id('1')
        self.model_instance_2 = skill_models.SkillModel.get_by_id('2')
        self.superseding_skill_0 = skill_models.SkillModel.get_by_id('3')
        self.superseding_skill_1 = skill_models.SkillModel.get_by_id('4')

        self.job_class = (
            prod_validation_jobs_one_off.SkillModelAuditOneOffJob)

    def test_standard_operation(self):
        skill_services.update_skill(
            self.admin_id, '0', [skill_domain.SkillChange({
                'cmd': 'update_skill_property',
                'property_name': 'description',
                'new_value': 'New description',
                'old_value': 'description 0'
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated SkillModel\', 5]']

        self.process_and_flush_pending_mapreduce_tasks()
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.commit(
            feconf.SYSTEM_COMMITTER_ID, 'created_on test', [])
        expected_output = [
            (
                u'[u\'failed validation check for time field relation check '
                'of SkillModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance_0.id,
                    self.model_instance_0.created_on,
                    self.model_instance_0.last_updated
                ),
            u'[u\'fully-validated SkillModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_0.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.superseding_skill_0.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.superseding_skill_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [
            '[u\'fully-validated SkillModel\', 4]',
            (
                u'[u\'failed validation check for current time check of '
                'SkillModel\', '
                '[u\'Entity id %s: The last_updated field has a '
                'value %s which is greater than the time when '
                'the job was run\']]'
            ) % (self.model_instance_2.id, self.model_instance_2.last_updated)
        ]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_skill_schema(self):
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'SkillModel\', '
                '[u\'Entity id %s: Entity fails domain validation with the '
                'error Invalid language code: %s\']]'
            ) % (self.model_instance_0.id, self.model_instance_0.language_code),
            u'[u\'fully-validated SkillModel\', 4]']
        with self.swap(
            constants, 'SUPPORTED_CONTENT_LANGUAGES', [{
                'code': 'en', 'description': 'English'}]):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_all_questions_merged(self):
        question_models.QuestionSkillLinkModel(
            id='question1-0', question_id='question1', skill_id='0',
            skill_difficulty=0.5).put()
        expected_output = [
            (
                u'[u\'failed validation check for all questions merged '
                'check of SkillModel\', '
                '[u"Entity id 0: all_questions_merged is True but the '
                'following question ids are still linked to the skill: '
                '[u\'question1\']"]]'
            ), u'[u\'fully-validated SkillModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_superseding_skill_model_failure(self):
        self.superseding_skill_0.delete(feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for superseding_skill_ids field '
                'check of SkillModel\', '
                '[u"Entity id 0: based on field superseding_skill_ids '
                'having value 3, expected model SkillModel with id 3 but it '
                'doesn\'t exist"]]'),
            u'[u\'fully-validated SkillModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_skill_commit_log_entry_model_failure(self):
        skill_services.update_skill(
            self.admin_id, '0', [skill_domain.SkillChange({
                'cmd': 'update_skill_property',
                'property_name': 'description',
                'new_value': 'New description',
                'old_value': 'description 0'
            })], 'Changes.')
        self.process_and_flush_pending_mapreduce_tasks()
        skill_models.SkillCommitLogEntryModel.get_by_id(
            'skill-0-1').delete()

        expected_output = [
            (
                u'[u\'failed validation check for '
                'skill_commit_log_entry_ids field check of '
                'SkillModel\', '
                '[u"Entity id 0: based on field '
                'skill_commit_log_entry_ids having value '
                'skill-0-1, expected model SkillCommitLogEntryModel '
                'with id skill-0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated SkillModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_summary_model_failure(self):
        skill_models.SkillSummaryModel.get_by_id('0').delete()

        expected_output = [
            (
                u'[u\'failed validation check for skill_summary_ids '
                'field check of SkillModel\', '
                '[u"Entity id 0: based on field skill_summary_ids having '
                'value 0, expected model SkillSummaryModel with id 0 '
                'but it doesn\'t exist"]]'),
            u'[u\'fully-validated SkillModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_metadata_model_failure(self):
        skill_models.SkillSnapshotMetadataModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of SkillModel\', '
                '[u"Entity id 0: based on field snapshot_metadata_ids having '
                'value 0-1, expected model SkillSnapshotMetadataModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated SkillModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_content_model_failure(self):
        skill_models.SkillSnapshotContentModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of SkillModel\', '
                '[u"Entity id 0: based on field snapshot_content_ids having '
                'value 0-1, expected model SkillSnapshotContentModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated SkillModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class SkillSnapshotMetadataModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(SkillSnapshotMetadataModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        language_codes = ['ar', 'en', 'en']
        skills = [skill_domain.Skill.create_default_skill(
            '%s' % i,
            'description %d' % i,
            rubrics
        ) for i in python_utils.RANGE(3)]

        example_1 = skill_domain.WorkedExample(
            state_domain.SubtitledHtml('2', '<p>Example Question 1</p>'),
            state_domain.SubtitledHtml('3', '<p>Example Explanation 1</p>')
        )
        skill_contents = skill_domain.SkillContents(
            state_domain.SubtitledHtml(
                '1', '<p>Explanation</p>'), [example_1],
            state_domain.RecordedVoiceovers.from_dict({
                'voiceovers_mapping': {
                    '1': {}, '2': {}, '3': {}
                }
            }),
            state_domain.WrittenTranslations.from_dict({
                'translations_mapping': {
                    '1': {}, '2': {}, '3': {}
                }
            })
        )

        misconception_dict = {
            'id': 0, 'name': 'name', 'notes': '<p>notes</p>',
            'feedback': '<p>default_feedback</p>',
            'must_be_addressed': True}

        misconception = skill_domain.Misconception.from_dict(
            misconception_dict)

        for index, skill in enumerate(skills):
            skill.language_code = language_codes[index]
            skill.skill_contents = skill_contents
            skill.add_misconception(misconception)
            if index == 0:
                skill_services.save_new_skill(self.user_id, skill)
            else:
                skill_services.save_new_skill(self.owner_id, skill)

        self.model_instance_0 = (
            skill_models.SkillSnapshotMetadataModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            skill_models.SkillSnapshotMetadataModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            skill_models.SkillSnapshotMetadataModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .SkillSnapshotMetadataModelAuditOneOffJob)

    def test_standard_operation(self):
        skill_services.update_skill(
            self.admin_id, '0', [skill_domain.SkillChange({
                'cmd': 'update_skill_property',
                'property_name': 'description',
                'new_value': 'New description',
                'old_value': 'description 0'
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated SkillSnapshotMetadataModel\', 4]']
        self.process_and_flush_pending_mapreduce_tasks()
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_committer_id_migration_bot(self):
        self.model_instance_1.committer_id = feconf.MIGRATION_BOT_USER_ID
        self.model_instance_1.update_timestamps(update_last_updated_time=False)
        self.model_instance_1.put()

        expected_output = [
            u'[u\'fully-validated SkillSnapshotMetadataModel\', 3]']
        self.process_and_flush_pending_mapreduce_tasks()
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_pseudo_committer_id(self):
        self.model_instance_1.committer_id = self.PSEUDONYMOUS_ID
        self.model_instance_1.update_timestamps(update_last_updated_time=False)
        self.model_instance_1.put()

        expected_output = [
            u'[u\'fully-validated SkillSnapshotMetadataModel\', 3]']
        self.process_and_flush_pending_mapreduce_tasks()
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of SkillSnapshotMetadataModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'SkillSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'SkillSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_skill_model_failure(self):
        skill_models.SkillModel.get_by_id('0').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for skill_ids '
                'field check of SkillSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field skill_ids '
                'having value 0, expected model SkillModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'skill_ids having value 0, expected model '
                'SkillModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'SkillSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, literal_eval=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of SkillSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field committer_ids having '
                'value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'SkillSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_skill_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            skill_models.SkillSnapshotMetadataModel(
                id='0-3', committer_id=self.owner_id, commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for skill model '
                'version check of SkillSnapshotMetadataModel\', '
                '[u\'Entity id 0-3: Skill model corresponding to '
                'id 0 has a version 1 which is less than the version 3 in '
                'snapshot metadata model id\']]'
            ), (
                u'[u\'fully-validated SkillSnapshotMetadataModel\', '
                '3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'add_skill_misconception'
        }, {
            'cmd': 'delete_skill_misconception',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'delete_skill_misconception check of '
                'SkillSnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'delete_skill_misconception\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with error: '
                'The following required attributes are missing: '
                'misconception_id, The following extra attributes are present: '
                'invalid_attribute"]]'
            ), (
                u'[u\'failed validation check for commit cmd '
                'add_skill_misconception check of '
                'SkillSnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'add_skill_misconception\'} '
                'failed with error: The following required attributes '
                'are missing: new_misconception_dict"]]'
            ), u'[u\'fully-validated SkillSnapshotMetadataModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class SkillSnapshotContentModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(SkillSnapshotContentModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        language_codes = ['ar', 'en', 'en']
        skills = [skill_domain.Skill.create_default_skill(
            '%s' % i,
            'description %d' % i,
            rubrics
        ) for i in python_utils.RANGE(3)]

        example_1 = skill_domain.WorkedExample(
            state_domain.SubtitledHtml('2', '<p>Example Question 1</p>'),
            state_domain.SubtitledHtml('3', '<p>Example Explanation 1</p>')
        )
        skill_contents = skill_domain.SkillContents(
            state_domain.SubtitledHtml(
                '1', '<p>Explanation</p>'), [example_1],
            state_domain.RecordedVoiceovers.from_dict({
                'voiceovers_mapping': {
                    '1': {}, '2': {}, '3': {}
                }
            }),
            state_domain.WrittenTranslations.from_dict({
                'translations_mapping': {
                    '1': {}, '2': {}, '3': {}
                }
            })
        )
        misconception_dict = {
            'id': 0, 'name': 'name', 'notes': '<p>notes</p>',
            'feedback': '<p>default_feedback</p>',
            'must_be_addressed': True}

        misconception = skill_domain.Misconception.from_dict(
            misconception_dict)

        for index, skill in enumerate(skills):
            skill.language_code = language_codes[index]
            skill.skill_contents = skill_contents
            skill.add_misconception(misconception)
            skill_services.save_new_skill(self.owner_id, skill)

        self.model_instance_0 = (
            skill_models.SkillSnapshotContentModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            skill_models.SkillSnapshotContentModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            skill_models.SkillSnapshotContentModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .SkillSnapshotContentModelAuditOneOffJob)

    def test_standard_operation(self):
        skill_services.update_skill(
            self.admin_id, '0', [skill_domain.SkillChange({
                'cmd': 'update_skill_property',
                'property_name': 'description',
                'new_value': 'New description',
                'old_value': 'description 0'
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated SkillSnapshotContentModel\', 4]']
        self.process_and_flush_pending_mapreduce_tasks()
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of SkillSnapshotContentModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'SkillSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'SkillSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_skill_model_failure(self):
        skill_models.SkillModel.get_by_id('0').delete(self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for skill_ids '
                'field check of SkillSnapshotContentModel\', '
                '[u"Entity id 0-1: based on field skill_ids '
                'having value 0, expected model SkillModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'skill_ids having value 0, expected model '
                'SkillModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'SkillSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_skill_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            skill_models.SkillSnapshotContentModel(
                id='0-3'))
        model_with_invalid_version_in_id.content = {}
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for skill model '
                'version check of SkillSnapshotContentModel\', '
                '[u\'Entity id 0-3: Skill model corresponding to '
                'id 0 has a version 1 which is less than '
                'the version 3 in snapshot content model id\']]'
            ), (
                u'[u\'fully-validated SkillSnapshotContentModel\', '
                '3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class SkillCommitLogEntryModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(SkillCommitLogEntryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        language_codes = ['ar', 'en', 'en']
        skills = [skill_domain.Skill.create_default_skill(
            '%s' % i,
            'description %d' % i,
            rubrics
        ) for i in python_utils.RANGE(3)]

        example_1 = skill_domain.WorkedExample(
            state_domain.SubtitledHtml('2', '<p>Example Question 1</p>'),
            state_domain.SubtitledHtml('3', '<p>Example Explanation 1</p>')
        )
        skill_contents = skill_domain.SkillContents(
            state_domain.SubtitledHtml(
                '1', '<p>Explanation</p>'), [example_1],
            state_domain.RecordedVoiceovers.from_dict({
                'voiceovers_mapping': {
                    '1': {}, '2': {}, '3': {}
                }
            }),
            state_domain.WrittenTranslations.from_dict({
                'translations_mapping': {
                    '1': {}, '2': {}, '3': {}
                }
            })
        )
        misconception_dict = {
            'id': 0, 'name': 'name', 'notes': '<p>notes</p>',
            'feedback': '<p>default_feedback</p>',
            'must_be_addressed': True}

        misconception = skill_domain.Misconception.from_dict(
            misconception_dict)

        for index, skill in enumerate(skills):
            skill.language_code = language_codes[index]
            skill.skill_contents = skill_contents
            skill.add_misconception(misconception)
            skill_services.save_new_skill(self.owner_id, skill)

        self.model_instance_0 = (
            skill_models.SkillCommitLogEntryModel.get_by_id(
                'skill-0-1'))
        self.model_instance_1 = (
            skill_models.SkillCommitLogEntryModel.get_by_id(
                'skill-1-1'))
        self.model_instance_2 = (
            skill_models.SkillCommitLogEntryModel.get_by_id(
                'skill-2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .SkillCommitLogEntryModelAuditOneOffJob)

    def test_standard_operation(self):
        skill_services.update_skill(
            self.admin_id, '0', [skill_domain.SkillChange({
                'cmd': 'update_skill_property',
                'property_name': 'description',
                'new_value': 'New description',
                'old_value': 'description 0'
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated SkillCommitLogEntryModel\', 4]']
        self.process_and_flush_pending_mapreduce_tasks()
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_user_id_migration_bot(self):
        self.model_instance_1.user_id = feconf.MIGRATION_BOT_USER_ID
        self.model_instance_1.update_timestamps(update_last_updated_time=False)
        self.model_instance_1.put()

        expected_output = [
            u'[u\'fully-validated SkillCommitLogEntryModel\', 3]'
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_pseudo_user_id(self):
        self.model_instance_1.user_id = self.PSEUDONYMOUS_ID
        self.model_instance_1.update_timestamps(update_last_updated_time=False)
        self.model_instance_1.put()

        expected_output = [
            u'[u\'fully-validated SkillCommitLogEntryModel\', 3]'
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of SkillCommitLogEntryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated SkillCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()

        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'SkillCommitLogEntryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_skill_model_failure(self):
        skill_models.SkillModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for skill_ids field '
                'check of SkillCommitLogEntryModel\', '
                '[u"Entity id skill-0-1: based on field skill_ids '
                'having value 0, expected model SkillModel with id '
                '0 but it doesn\'t exist", u"Entity id skill-0-2: '
                'based on field skill_ids having value 0, expected '
                'model SkillModel with id 0 but it doesn\'t exist"]]'
            ), u'[u\'fully-validated SkillCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)

    def test_invalid_skill_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            skill_models.SkillCommitLogEntryModel.create(
                '0', 3, self.owner_id, 'edit', 'msg', [{}],
                constants.ACTIVITY_STATUS_PUBLIC, False))
        model_with_invalid_version_in_id.skill_id = '0'
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for skill model '
                'version check of SkillCommitLogEntryModel\', '
                '[u\'Entity id %s: Skill model corresponding '
                'to id 0 has a version 1 which is less than '
                'the version 3 in commit log entry model id\']]'
            ) % (model_with_invalid_version_in_id.id),
            u'[u\'fully-validated SkillCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_id(self):
        model_with_invalid_id = (
            skill_models.SkillCommitLogEntryModel(
                id='invalid-0-1',
                user_id=self.owner_id,
                commit_type='edit',
                commit_message='msg',
                commit_cmds=[{}],
                post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
                post_commit_is_private=False))
        model_with_invalid_id.skill_id = '0'
        model_with_invalid_id.update_timestamps()
        model_with_invalid_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for model id check of '
                'SkillCommitLogEntryModel\', '
                '[u\'Entity id %s: Entity id does not match regex pattern\']]'
            ) % (model_with_invalid_id.id), (
                u'[u\'failed validation check for commit cmd check of '
                'SkillCommitLogEntryModel\', [u\'Entity id invalid-0-1: '
                'No commit command domain object defined for entity with '
                'commands: [{}]\']]'),
            u'[u\'fully-validated SkillCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_type(self):
        self.model_instance_0.commit_type = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit type check of '
                'SkillCommitLogEntryModel\', '
                '[u\'Entity id skill-0-1: Commit type invalid is '
                'not allowed\']]'
            ), u'[u\'fully-validated SkillCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_post_commit_status(self):
        self.model_instance_0.post_commit_status = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for post commit status check '
                'of SkillCommitLogEntryModel\', '
                '[u\'Entity id skill-0-1: Post commit status invalid '
                'is invalid\']]'
            ), u'[u\'fully-validated SkillCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_private_post_commit_status(self):
        self.model_instance_0.post_commit_status = 'private'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for post commit status check '
                'of SkillCommitLogEntryModel\', '
                '[u\'Entity id skill-0-1: Post commit status private '
                'is invalid\']]'
            ), u'[u\'fully-validated SkillCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'add_skill_misconception'
        }, {
            'cmd': 'delete_skill_misconception',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'add_skill_misconception check of SkillCommitLogEntryModel\', '
                '[u"Entity id skill-0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'add_skill_misconception\'} '
                'failed with error: The following required attributes are '
                'missing: new_misconception_dict"]]'
            ), (
                u'[u\'failed validation check for commit cmd '
                'delete_skill_misconception check of '
                'SkillCommitLogEntryModel\', '
                '[u"Entity id skill-0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'delete_skill_misconception\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with error: '
                'The following required attributes are missing: '
                'misconception_id, The following extra attributes are present: '
                'invalid_attribute"]]'
            ), u'[u\'fully-validated SkillCommitLogEntryModel\', 2]']

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class SkillSummaryModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(SkillSummaryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        language_codes = ['ar', 'en', 'en']
        skills = [skill_domain.Skill.create_default_skill(
            '%s' % i,
            'description %d' % i,
            rubrics
        ) for i in python_utils.RANGE(3)]

        example_1 = skill_domain.WorkedExample(
            state_domain.SubtitledHtml('2', '<p>Example Question 1</p>'),
            state_domain.SubtitledHtml('3', '<p>Example Explanation 1</p>')
        )
        skill_contents = skill_domain.SkillContents(
            state_domain.SubtitledHtml(
                '1', '<p>Explanation</p>'), [example_1],
            state_domain.RecordedVoiceovers.from_dict({
                'voiceovers_mapping': {
                    '1': {}, '2': {}, '3': {}
                }
            }),
            state_domain.WrittenTranslations.from_dict({
                'translations_mapping': {
                    '1': {}, '2': {}, '3': {}
                }
            })
        )

        misconception_dict = {
            'id': 0, 'name': 'name', 'notes': '<p>notes</p>',
            'feedback': '<p>default_feedback</p>',
            'must_be_addressed': True}

        misconception = skill_domain.Misconception.from_dict(
            misconception_dict)

        for index, skill in enumerate(skills):
            skill.language_code = language_codes[index]
            skill.skill_contents = skill_contents
            skill.add_misconception(misconception)
            skill_services.save_new_skill(self.owner_id, skill)

        self.model_instance_0 = skill_models.SkillSummaryModel.get_by_id('0')
        self.model_instance_1 = skill_models.SkillSummaryModel.get_by_id('1')
        self.model_instance_2 = skill_models.SkillSummaryModel.get_by_id('2')

        self.job_class = (
            prod_validation_jobs_one_off.SkillSummaryModelAuditOneOffJob)

    def test_standard_operation(self):
        skill_services.update_skill(
            self.admin_id, '0', [skill_domain.SkillChange({
                'cmd': 'update_skill_property',
                'property_name': 'description',
                'new_value': 'New description',
                'old_value': 'description 0'
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated SkillSummaryModel\', 3]']
        self.process_and_flush_pending_mapreduce_tasks()
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of SkillSummaryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated SkillSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        skill_services.delete_skill(self.owner_id, '1')
        skill_services.delete_skill(self.owner_id, '2')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'SkillSummaryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_skill_model_failure(self):
        skill_model = skill_models.SkillModel.get_by_id('0')
        skill_model.delete(feconf.SYSTEM_COMMITTER_ID, '', [])
        self.model_instance_0.skill_model_last_updated = (
            skill_model.last_updated)
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for skill_ids '
                'field check of SkillSummaryModel\', '
                '[u"Entity id 0: based on field skill_ids having '
                'value 0, expected model SkillModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated SkillSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_misconception_count(self):
        self.model_instance_0.misconception_count = 10
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for misconception count '
                'check of SkillSummaryModel\', '
                '[u"Entity id 0: Misconception count: 10 does not match '
                'the number of misconceptions in skill model: '
                '[{u\'id\': 0, u\'must_be_addressed\': True, '
                'u\'notes\': u\'<p>notes</p>\', u\'name\': u\'name\', '
                'u\'feedback\': u\'<p>default_feedback</p>\'}]"]]'
            ), u'[u\'fully-validated SkillSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_worked_examples_count(self):
        self.model_instance_0.worked_examples_count = 10
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for worked examples '
                'count check of SkillSummaryModel\', '
                '[u"Entity id 0: Worked examples count: 10 does not '
                'match the number of worked examples in skill_contents '
                'in skill model: [{u\'explanation\': {u\'content_id\': u\'3\', '
                'u\'html\': u\'<p>Example Explanation 1</p>\'}, u\'question\': '
                '{u\'content_id\': u\'2\', u\'html\': u\'<p>Example Question '
                '1</p>\'}}]"]]'
            ), u'[u\'fully-validated SkillSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_skill_related_property(self):
        self.model_instance_0.description = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for description field check of '
                'SkillSummaryModel\', '
                '[u\'Entity id %s: description field in entity: invalid does '
                'not match corresponding skill description field: '
                'description 0\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated SkillSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)
