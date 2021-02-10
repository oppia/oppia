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

"""Unit tests for core.domain.question_validators."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from constants import constants
from core.domain import prod_validation_jobs_one_off
from core.domain import question_domain
from core.domain import question_services
from core.domain import skill_domain
from core.domain import skill_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

datastore_services = models.Registry.import_datastore_services()

USER_EMAIL = 'useremail@example.com'
USER_NAME = 'username'

(question_models, skill_models, user_models) = models.Registry.import_models([
    models.NAMES.question, models.NAMES.skill, models.NAMES.user])


class QuestionModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(QuestionModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        misconceptions = [
            skill_domain.Misconception(
                0, 'name', '<p>notes</p>',
                '<p>default_feedback</p>', True),
            skill_domain.Misconception(
                1, 'name', '<p>notes</p>',
                '<p>default_feedback</p>', False)
        ]
        skills = [skill_domain.Skill.create_default_skill(
            '%s' % i * 12,
            'description %d' % i,
            rubrics
        ) for i in python_utils.RANGE(6)]
        for skill in skills:
            skill.misconceptions = misconceptions
            skill.next_misconception_id = 2
            skill_services.save_new_skill(self.owner_id, skill)

        language_codes = ['ar', 'en', 'en']
        questions = [question_domain.Question.create_default_question(
            '%s' % i,
            ['%s' % (i * 2) * 12, '%s' % (i * 2 + 1) * 12]
        ) for i in python_utils.RANGE(3)]

        for index, question in enumerate(questions):
            question.language_code = language_codes[index]
            question.question_state_data = self._create_valid_question_data(
                'Test')
            question_services.create_new_question(
                self.owner_id, question, 'test question')

        self.model_instance_0 = question_models.QuestionModel.get_by_id('0')
        self.model_instance_1 = question_models.QuestionModel.get_by_id('1')
        self.model_instance_2 = question_models.QuestionModel.get_by_id('2')

        self.job_class = (
            prod_validation_jobs_one_off.QuestionModelAuditOneOffJob)

    def test_standard_operation(self):
        question_services.update_question(
            self.owner_id, '0', [question_domain.QuestionChange({
                'cmd': 'update_question_property',
                'property_name': 'language_code',
                'new_value': 'en',
                'old_value': 'ar'
            })], 'Changes.')

        expected_output = [
            u'[u\'fully-validated QuestionModel\', 3]']
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
                'of QuestionModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance_0.id,
                    self.model_instance_0.created_on,
                    self.model_instance_0.last_updated
                ),
            u'[u\'fully-validated QuestionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.model_instance_2.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [
            '[u\'fully-validated QuestionModel\', 2]',
            (
                u'[u\'failed validation check for current time check of '
                'QuestionModel\', '
                '[u\'Entity id %s: The last_updated field has a '
                'value %s which is greater than the time when '
                'the job was run\']]'
            ) % (self.model_instance_0.id, self.model_instance_0.last_updated)
        ]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_question_schema(self):
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'QuestionModel\', '
                '[u\'Entity id %s: Entity fails domain validation with the '
                'error Invalid language code: %s\']]'
            ) % (self.model_instance_0.id, self.model_instance_0.language_code),
            u'[u\'fully-validated QuestionModel\', 2]']
        with self.swap(
            constants, 'SUPPORTED_CONTENT_LANGUAGES', [{
                'code': 'en', 'description': 'English'}]):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_linked_skill_model_failure(self):
        skill_models.SkillModel.get_by_id('111111111111').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for linked_skill_ids field '
                'check of QuestionModel\', '
                '[u"Entity id 0: based on field linked_skill_ids '
                'having value 111111111111, expected model SkillModel with id '
                '111111111111 but it doesn\'t exist"]]'),
            u'[u\'fully-validated QuestionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_question_commit_log_entry_model_failure(self):
        question_services.update_question(
            self.owner_id, '0', [question_domain.QuestionChange({
                'cmd': 'update_question_property',
                'property_name': 'language_code',
                'new_value': 'en',
                'old_value': 'ar'
            })], 'Changes.')
        question_models.QuestionCommitLogEntryModel.get_by_id(
            'question-0-1').delete()

        expected_output = [
            (
                u'[u\'failed validation check for '
                'question_commit_log_entry_ids field check of '
                'QuestionModel\', '
                '[u"Entity id 0: based on field '
                'question_commit_log_entry_ids having value '
                'question-0-1, expected model QuestionCommitLogEntryModel '
                'with id question-0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated QuestionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_summary_model_failure(self):
        question_models.QuestionSummaryModel.get_by_id('0').delete()

        expected_output = [
            (
                u'[u\'failed validation check for question_summary_ids '
                'field check of QuestionModel\', '
                '[u"Entity id 0: based on field question_summary_ids having '
                'value 0, expected model QuestionSummaryModel with id 0 '
                'but it doesn\'t exist"]]'),
            u'[u\'fully-validated QuestionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_metadata_model_failure(self):
        question_models.QuestionSnapshotMetadataModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of QuestionModel\', '
                '[u"Entity id 0: based on field snapshot_metadata_ids having '
                'value 0-1, expected model QuestionSnapshotMetadataModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated QuestionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_content_model_failure(self):
        question_models.QuestionSnapshotContentModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of QuestionModel\', '
                '[u"Entity id 0: based on field snapshot_content_ids having '
                'value 0-1, expected model QuestionSnapshotContentModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated QuestionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_inapplicable_skill_misconception_ids_invalid_skill_failure(self):
        question_services.update_question(
            self.owner_id, '0', [question_domain.QuestionChange({
                'cmd': 'update_question_property',
                'property_name': 'inapplicable_skill_misconception_ids',
                'new_value': ['invalidskill-0'],
                'old_value': []
            })], 'Add invalid skill misconception id.')

        expected_output = [
            u'[u\'failed validation check for skill id of QuestionModel\','
            u' [u\'Entity id 0: skill with the following id does not exist: '
            u'invalidskill\']]',
            u'[u\'fully-validated QuestionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_inapplicable_skill_misconception_ids_invalid_id_failure(self):
        question_services.update_question(
            self.owner_id, '0', [question_domain.QuestionChange({
                'cmd': 'update_question_property',
                'property_name': 'inapplicable_skill_misconception_ids',
                'new_value': ['000000000000-99'],
                'old_value': []
            })], 'Add invalid skill misconception id.')

        expected_output = [
            u'[u\'failed validation check for misconception id of '
            u'QuestionModel\', [u\'Entity id 0: misconception with '
            u'the id 99 does not exist in the skill with id 000000000000\']]',
            u'[u\'fully-validated QuestionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_inapplicable_skill_misconception_ids_validation_success(self):
        question_services.update_question(
            self.owner_id, '0', [question_domain.QuestionChange({
                'cmd': 'update_question_property',
                'property_name': 'inapplicable_skill_misconception_ids',
                'new_value': ['000000000000-0', '000000000000-1'],
                'old_value': []
            })], 'Add invalid skill misconception id.')

        expected_output = [
            u'[u\'fully-validated QuestionModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class QuestionSkillLinkModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(QuestionSkillLinkModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        skills = [skill_domain.Skill.create_default_skill(
            '%s' % i,
            'description %d' % i,
            rubrics
        ) for i in python_utils.RANGE(3)]
        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        language_codes = ['ar', 'en', 'en']
        questions = [question_domain.Question.create_default_question(
            '%s' % i,
            ['%s' % (2 - i)]
        ) for i in python_utils.RANGE(3)]

        for index, question in enumerate(questions):
            question.language_code = language_codes[index]
            question.question_state_data = self._create_valid_question_data(
                'Test')
            question_services.create_new_question(
                self.owner_id, question, 'test question')

        self.model_instance_0 = (
            question_models.QuestionSkillLinkModel(
                id='0:2', question_id='0', skill_id='2', skill_difficulty=0.5))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        self.model_instance_1 = (
            question_models.QuestionSkillLinkModel(
                id='1:1', question_id='1', skill_id='1', skill_difficulty=0.5))
        self.model_instance_1.update_timestamps()
        self.model_instance_1.put()
        self.model_instance_2 = (
            question_models.QuestionSkillLinkModel(
                id='2:0', question_id='2', skill_id='0', skill_difficulty=0.5))
        self.model_instance_2.update_timestamps()
        self.model_instance_2.put()

        self.job_class = (
            prod_validation_jobs_one_off.QuestionSkillLinkModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated QuestionSkillLinkModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for time field relation check '
                'of QuestionSkillLinkModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance_0.id,
                    self.model_instance_0.created_on,
                    self.model_instance_0.last_updated
                ),
            u'[u\'fully-validated QuestionSkillLinkModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'QuestionSkillLinkModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_skill_model_failure(self):
        skill_models.SkillModel.get_by_id('2').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for skill_ids field '
                'check of QuestionSkillLinkModel\', '
                '[u"Entity id 0:2: based on field skill_ids '
                'having value 2, expected model SkillModel with id 2 but it '
                'doesn\'t exist"]]'),
            u'[u\'fully-validated QuestionSkillLinkModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_question_model_failure(self):
        question_models.QuestionModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for '
                'question_ids field check of QuestionSkillLinkModel\', '
                '[u"Entity id 0:2: based on field '
                'question_ids having value 0, expected model QuestionModel '
                'with id 0 but it doesn\'t exist"]]'),
            u'[u\'fully-validated QuestionSkillLinkModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_id_failure(self):
        model_with_invalid_id = question_models.QuestionSkillLinkModel(
            id='0:1', question_id='1', skill_id='2', skill_difficulty=0.5)
        model_with_invalid_id.update_timestamps()
        model_with_invalid_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for model id check of '
                'QuestionSkillLinkModel\', [u\'Entity id 0:1: Entity id '
                'does not match regex pattern\']]'
            ), u'[u\'fully-validated QuestionSkillLinkModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class QuestionSnapshotMetadataModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(QuestionSnapshotMetadataModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        skills = [skill_domain.Skill.create_default_skill(
            '%s' % i,
            'description %d' % i,
            rubrics
        ) for i in python_utils.RANGE(6)]
        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        language_codes = ['ar', 'en', 'en']
        questions = [question_domain.Question.create_default_question(
            '%s' % i,
            ['%s' % (i * 2), '%s' % (i * 2 + 1)]
        ) for i in python_utils.RANGE(3)]

        for index, question in enumerate(questions):
            question.language_code = language_codes[index]
            question.question_state_data = self._create_valid_question_data(
                'Test')
            if index == 0:
                question_services.create_new_question(
                    self.user_id, question, 'test question')
            else:
                question_services.create_new_question(
                    self.owner_id, question, 'test question')

        self.model_instance_0 = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            question_models.QuestionSnapshotMetadataModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .QuestionSnapshotMetadataModelAuditOneOffJob)

    def test_standard_operation(self):
        question_services.update_question(
            self.owner_id, '0', [question_domain.QuestionChange({
                'cmd': 'update_question_property',
                'property_name': 'language_code',
                'new_value': 'en',
                'old_value': 'ar'
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated QuestionSnapshotMetadataModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_user_id_migration_bot(self):
        self.model_instance_1.user_id = feconf.MIGRATION_BOT_USER_ID
        self.model_instance_1.update_timestamps(update_last_updated_time=False)
        self.model_instance_1.put()

        expected_output = [
            u'[u\'fully-validated QuestionSnapshotMetadataModel\', 3]'
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_pseudo_user_id(self):
        self.model_instance_1.user_id = self.PSEUDONYMOUS_ID
        self.model_instance_1.update_timestamps(update_last_updated_time=False)
        self.model_instance_1.put()

        expected_output = [
            u'[u\'fully-validated QuestionSnapshotMetadataModel\', 3]'
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
            'of QuestionSnapshotMetadataModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'QuestionSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'QuestionSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_question_model_failure(self):
        question_models.QuestionModel.get_by_id('0').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for question_ids '
                'field check of QuestionSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field question_ids '
                'having value 0, expected model QuestionModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'question_ids having value 0, expected model '
                'QuestionModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'QuestionSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, literal_eval=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of QuestionSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field committer_ids having '
                'value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'QuestionSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_question_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            question_models.QuestionSnapshotMetadataModel(
                id='0-3', committer_id=self.owner_id, commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for question model '
                'version check of QuestionSnapshotMetadataModel\', '
                '[u\'Entity id 0-3: Question model corresponding to '
                'id 0 has a version 1 which is less than the version 3 in '
                'snapshot metadata model id\']]'
            ), (
                u'[u\'fully-validated QuestionSnapshotMetadataModel\', '
                '3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'update_question_property'
        }, {
            'cmd': 'create_new_fully_specified_question',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'create_new_fully_specified_question check of '
                'QuestionSnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation '
                'for command: {u\'cmd\': '
                'u\'create_new_fully_specified_question\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with error: '
                'The following required attributes are missing: '
                'question_dict, skill_id, The following extra attributes '
                'are present: invalid_attribute"]]'
            ), (
                u'[u\'failed validation check for commit cmd '
                'update_question_property check of '
                'QuestionSnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'update_question_property\'} '
                'failed with error: The following required attributes '
                'are missing: new_value, old_value, property_name"]]'
            ), u'[u\'fully-validated QuestionSnapshotMetadataModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class QuestionSnapshotContentModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(QuestionSnapshotContentModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        skills = [skill_domain.Skill.create_default_skill(
            '%s' % i,
            'description %d' % i,
            rubrics
        ) for i in python_utils.RANGE(6)]
        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        language_codes = ['ar', 'en', 'en']
        questions = [question_domain.Question.create_default_question(
            '%s' % i,
            ['%s' % (i * 2), '%s' % (i * 2 + 1)]
        ) for i in python_utils.RANGE(3)]

        for index, question in enumerate(questions):
            question.language_code = language_codes[index]
            question.question_state_data = self._create_valid_question_data(
                'Test')
            question_services.create_new_question(
                self.owner_id, question, 'test question')

        self.model_instance_0 = (
            question_models.QuestionSnapshotContentModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            question_models.QuestionSnapshotContentModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            question_models.QuestionSnapshotContentModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .QuestionSnapshotContentModelAuditOneOffJob)

    def test_standard_operation(self):
        question_services.update_question(
            self.owner_id, '0', [question_domain.QuestionChange({
                'cmd': 'update_question_property',
                'property_name': 'language_code',
                'new_value': 'en',
                'old_value': 'ar'
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated QuestionSnapshotContentModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of QuestionSnapshotContentModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'QuestionSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'QuestionSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_question_model_failure(self):
        question_models.QuestionModel.get_by_id('0').delete(
            self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for question_ids '
                'field check of QuestionSnapshotContentModel\', '
                '[u"Entity id 0-1: based on field question_ids '
                'having value 0, expected model QuestionModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'question_ids having value 0, expected model '
                'QuestionModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'QuestionSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_question_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            question_models.QuestionSnapshotContentModel(
                id='0-3'))
        model_with_invalid_version_in_id.content = {}
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for question model '
                'version check of QuestionSnapshotContentModel\', '
                '[u\'Entity id 0-3: Question model corresponding to '
                'id 0 has a version 1 which is less than '
                'the version 3 in snapshot content model id\']]'
            ), (
                u'[u\'fully-validated QuestionSnapshotContentModel\', '
                '3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class QuestionCommitLogEntryModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(QuestionCommitLogEntryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        skills = [skill_domain.Skill.create_default_skill(
            '%s' % i,
            'description %d' % i,
            rubrics
        ) for i in python_utils.RANGE(6)]
        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        language_codes = ['ar', 'en', 'en']
        questions = [question_domain.Question.create_default_question(
            '%s' % i,
            ['%s' % (i * 2), '%s' % (i * 2 + 1)]
        ) for i in python_utils.RANGE(3)]

        for index, question in enumerate(questions):
            question.language_code = language_codes[index]
            question.question_state_data = self._create_valid_question_data(
                'Test')
            question_services.create_new_question(
                self.owner_id, question, 'test question')

        self.model_instance_0 = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-0-1'))
        self.model_instance_1 = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-1-1'))
        self.model_instance_2 = (
            question_models.QuestionCommitLogEntryModel.get_by_id(
                'question-2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .QuestionCommitLogEntryModelAuditOneOffJob)

    def test_standard_operation(self):
        question_services.update_question(
            self.owner_id, '0', [question_domain.QuestionChange({
                'cmd': 'update_question_property',
                'property_name': 'language_code',
                'new_value': 'en',
                'old_value': 'ar'
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated QuestionCommitLogEntryModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_user_id_migration_bot(self):
        self.model_instance_1.user_id = feconf.MIGRATION_BOT_USER_ID
        self.model_instance_1.update_timestamps(update_last_updated_time=False)
        self.model_instance_1.put()

        expected_output = [
            u'[u\'fully-validated QuestionCommitLogEntryModel\', 3]'
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_pseudo_user_id(self):
        self.model_instance_1.user_id = self.PSEUDONYMOUS_ID
        self.model_instance_1.update_timestamps(update_last_updated_time=False)
        self.model_instance_1.put()

        expected_output = [
            u'[u\'fully-validated QuestionCommitLogEntryModel\', 3]'
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
            'of QuestionCommitLogEntryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated QuestionCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'QuestionCommitLogEntryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_question_model_failure(self):
        question_models.QuestionModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for question_ids field '
                'check of QuestionCommitLogEntryModel\', '
                '[u"Entity id question-0-1: based on field question_ids '
                'having value 0, expected model QuestionModel with id '
                '0 but it doesn\'t exist", u"Entity id question-0-2: '
                'based on field question_ids having value 0, expected '
                'model QuestionModel with id 0 but it doesn\'t exist"]]'
            ), u'[u\'fully-validated QuestionCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)

    def test_invalid_question_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            question_models.QuestionCommitLogEntryModel.create(
                '0', 3, self.owner_id, 'edit', 'msg', [{}],
                constants.ACTIVITY_STATUS_PUBLIC, False))
        model_with_invalid_version_in_id.question_id = '0'
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for question model '
                'version check of QuestionCommitLogEntryModel\', '
                '[u\'Entity id %s: Question model corresponding '
                'to id 0 has a version 1 which is less than '
                'the version 3 in commit log entry model id\']]'
            ) % (model_with_invalid_version_in_id.id),
            u'[u\'fully-validated QuestionCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_id(self):
        model_with_invalid_id = (
            question_models.QuestionCommitLogEntryModel(
                id='invalid-0-1',
                user_id=self.owner_id,
                commit_type='edit',
                commit_message='msg',
                commit_cmds=[{}],
                post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
                post_commit_is_private=False))
        model_with_invalid_id.question_id = '0'
        model_with_invalid_id.update_timestamps()
        model_with_invalid_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for model id check of '
                'QuestionCommitLogEntryModel\', '
                '[u\'Entity id %s: Entity id does not match regex pattern\']]'
            ) % (model_with_invalid_id.id), (
                u'[u\'failed validation check for commit cmd check of '
                'QuestionCommitLogEntryModel\', [u\'Entity id invalid-0-1: '
                'No commit command domain object defined for entity with '
                'commands: [{}]\']]'),
            u'[u\'fully-validated QuestionCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_type(self):
        self.model_instance_0.commit_type = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit type check of '
                'QuestionCommitLogEntryModel\', '
                '[u\'Entity id question-0-1: Commit type invalid is '
                'not allowed\']]'
            ), u'[u\'fully-validated QuestionCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_post_commit_status(self):
        self.model_instance_0.post_commit_status = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for post commit status check '
                'of QuestionCommitLogEntryModel\', '
                '[u\'Entity id question-0-1: Post commit status invalid '
                'is invalid\']]'
            ), u'[u\'fully-validated QuestionCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_private_post_commit_status(self):
        self.model_instance_0.post_commit_status = 'private'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for post commit status check '
                'of QuestionCommitLogEntryModel\', '
                '[u\'Entity id question-0-1: Post commit status private '
                'is invalid\']]'
            ), u'[u\'fully-validated QuestionCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'update_question_property'
        }, {
            'cmd': 'create_new_fully_specified_question',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'create_new_fully_specified_question check of '
                'QuestionCommitLogEntryModel\', '
                '[u"Entity id question-0-1: Commit command domain '
                'validation for command: {u\'cmd\': '
                'u\'create_new_fully_specified_question\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with '
                'error: The following required attributes are '
                'missing: question_dict, skill_id, The following '
                'extra attributes are present: invalid_attribute"]]'
            ), (
                u'[u\'failed validation check for commit cmd '
                'update_question_property check of '
                'QuestionCommitLogEntryModel\', [u"Entity id '
                'question-0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'update_question_property\'} '
                'failed with error: The following required attributes '
                'are missing: new_value, old_value, property_name"]]'
            ), u'[u\'fully-validated QuestionCommitLogEntryModel\', 2]']

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class QuestionSummaryModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(QuestionSummaryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        skills = [skill_domain.Skill.create_default_skill(
            '%s' % i,
            'description %d' % i,
            rubrics
        ) for i in python_utils.RANGE(6)]
        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        language_codes = ['ar', 'en', 'en']
        questions = [question_domain.Question.create_default_question(
            '%s' % i,
            ['%s' % (i * 2), '%s' % (i * 2 + 1)]
        ) for i in python_utils.RANGE(3)]

        for index, question in enumerate(questions):
            question.language_code = language_codes[index]
            question.question_state_data = self._create_valid_question_data(
                'Test')
            question.question_state_data.content.html = '<p>Test</p>'
            question_services.create_new_question(
                self.owner_id, question, 'test question')

        self.model_instance_0 = question_models.QuestionSummaryModel.get_by_id(
            '0')
        self.model_instance_1 = question_models.QuestionSummaryModel.get_by_id(
            '1')
        self.model_instance_2 = question_models.QuestionSummaryModel.get_by_id(
            '2')

        self.job_class = (
            prod_validation_jobs_one_off.QuestionSummaryModelAuditOneOffJob)

    def test_standard_operation(self):
        question_services.update_question(
            self.owner_id, '0', [question_domain.QuestionChange({
                'cmd': 'update_question_property',
                'property_name': 'language_code',
                'new_value': 'en',
                'old_value': 'ar'
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated QuestionSummaryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of QuestionSummaryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated QuestionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        question_services.delete_question(self.owner_id, '1')
        question_services.delete_question(self.owner_id, '2')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'QuestionSummaryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_question_model_failure(self):
        question_model = question_models.QuestionModel.get_by_id('0')
        question_model.delete(feconf.SYSTEM_COMMITTER_ID, '', [])
        self.model_instance_0.question_model_last_updated = (
            question_model.last_updated)
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for question_ids '
                'field check of QuestionSummaryModel\', '
                '[u"Entity id 0: based on field question_ids having '
                'value 0, expected model QuestionModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated QuestionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_question_content(self):
        self.model_instance_0.question_content = '<p>invalid</p>'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for question content check '
                'of QuestionSummaryModel\', [u\'Entity id 0: Question '
                'content: <p>invalid</p> does not match content html '
                'in question state data in question model: <p>Test</p>\']]'
            ), u'[u\'fully-validated QuestionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_question_related_property(self):
        mock_time = datetime.datetime.utcnow() - datetime.timedelta(
            days=2)
        actual_time = self.model_instance_0.question_model_created_on
        self.model_instance_0.question_model_created_on = mock_time
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for question_model_created_on '
                'field check of QuestionSummaryModel\', '
                '[u\'Entity id %s: question_model_created_on field in '
                'entity: %s does not match corresponding question '
                'created_on field: %s\']]'
            ) % (self.model_instance_0.id, mock_time, actual_time),
            u'[u\'fully-validated QuestionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)
