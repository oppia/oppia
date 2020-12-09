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

"""Unit tests for core.domain.suggestion_validators."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from constants import constants
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import prod_validation_jobs_one_off
from core.domain import question_domain
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import suggestion_validators
from core.platform import models
from core.tests import test_utils
import feconf

datastore_services = models.Registry.import_datastore_services()

(
    exp_models, feedback_models, suggestion_models, user_models
) = models.Registry.import_models([
    models.NAMES.exploration, models.NAMES.feedback, models.NAMES.suggestion,
    models.NAMES.user
])


class GeneralSuggestionModelValidatorTests(test_utils.AuditJobsTestBase):
    def setUp(self):
        super(GeneralSuggestionModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        exp = exp_domain.Exploration.create_default_exploration(
            '0',
            title='title 0',
            category='Art',
        )
        exp_services.save_new_exploration(self.owner_id, exp)

        change = {
            'cmd': exp_domain.CMD_EDIT_STATE_PROPERTY,
            'property_name': exp_domain.STATE_PROPERTY_CONTENT,
            'state_name': 'state_1',
            'new_value': 'new suggestion content'
        }

        self.thread_id = feedback_services.create_thread(
            'exploration', '0', self.owner_id, 'description',
            'suggestion', has_suggestion=True)

        score_category = (
            suggestion_models.SCORE_TYPE_CONTENT +
            suggestion_models.SCORE_CATEGORY_DELIMITER + exp.category)

        suggestion_models.GeneralSuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_EDIT_STATE_CONTENT,
            suggestion_models.TARGET_TYPE_EXPLORATION, '0',
            1, suggestion_models.STATUS_ACCEPTED, self.owner_id,
            self.admin_id, change, score_category, self.thread_id, None)
        self.model_instance = (
            suggestion_models.GeneralSuggestionModel.get_by_id(self.thread_id))

        self.job_class = (
            prod_validation_jobs_one_off.GeneralSuggestionModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated GeneralSuggestionModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of GeneralSuggestionModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id,
                self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'GeneralSuggestionModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]
        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids field '
                'check of GeneralSuggestionModel\', '
                '[u"Entity id %s: based on field exploration_ids having value '
                '0, expected model ExplorationModel with id 0 but it doesn\'t '
                'exist"]]') % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_feedback_thread_model_failure(self):
        feedback_models.GeneralFeedbackThreadModel.get_by_id(
            self.thread_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for feedback_thread_ids field '
                'check of GeneralSuggestionModel\', '
                '[u"Entity id %s: based on field feedback_thread_ids having '
                'value %s, expected model GeneralFeedbackThreadModel with id '
                '%s but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.thread_id, self.thread_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_author_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.owner_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for author_ids field '
                'check of GeneralSuggestionModel\', '
                '[u"Entity id %s: based on field author_ids having value '
                '%s, expected model UserSettingsModel with id %s but it '
                'doesn\'t exist"]]') % (
                    self.model_instance.id, self.owner_id, self.owner_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_reviewer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.admin_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for reviewer_ids field '
                'check of GeneralSuggestionModel\', '
                '[u"Entity id %s: based on field reviewer_ids having value '
                '%s, expected model UserSettingsModel with id %s but it '
                'doesn\'t exist"]]') % (
                    self.model_instance.id, self.admin_id, self.admin_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_bot_as_final_reviewer_does_not_fail_reviewer_id_validation(self):
        self.assertEqual(
            user_models.UserSettingsModel.get_by_id(
                feconf.SUGGESTION_BOT_USER_ID), None)

        self.model_instance.final_reviewer_id = feconf.SUGGESTION_BOT_USER_ID
        self.model_instance.update_timestamps()
        self.model_instance.put()

        expected_output = [
            u'[u\'fully-validated GeneralSuggestionModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_target_version(self):
        self.model_instance.target_version_at_submission = 5
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for target version at submission'
                ' check of GeneralSuggestionModel\', [u\'Entity id %s: '
                'target version 5 in entity is greater than the '
                'version 1 of exploration corresponding to id 0\']]'
            ) % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_empty_final_reviewer_id(self):
        self.model_instance.final_reviewer_id = None
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for final reviewer '
                'check of GeneralSuggestionModel\', [u\'Entity id %s: '
                'Final reviewer id is empty but suggestion is accepted\']]'
            ) % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_wrong_final_reviewer_id_format(self):
        self.model_instance.final_reviewer_id = 'wrong_id'
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                '[u\'failed validation check for domain object check of '
                'GeneralSuggestionModel\', [u\'Entity id %s: '
                'Entity fails domain validation with the error Expected '
                'final_reviewer_id to be in a valid user ID format, '
                'received %s\']]'
            ) % (self.model_instance.id, self.model_instance.final_reviewer_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_non_empty_final_reviewer_id(self):
        self.model_instance.status = suggestion_models.STATUS_IN_REVIEW
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for final reviewer '
                'check of GeneralSuggestionModel\', [u\'Entity id %s: '
                'Final reviewer id %s is not empty but '
                'suggestion is in review\']]'
            ) % (self.model_instance.id, self.admin_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_wrong_author_id_format(self):
        self.model_instance.author_id = 'wrong_id'
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                '[u\'failed validation check for domain object check of '
                'GeneralSuggestionModel\', [u\'Entity id %s: '
                'Entity fails domain validation with the error Expected '
                'author_id to be in a valid user ID format, received %s\']]'
            ) % (self.model_instance.id, self.model_instance.author_id)]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_schema(self):
        self.model_instance.score_category = 'invalid.Art'
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for domain object check '
                'of GeneralSuggestionModel\', [u\'Entity id %s: Entity '
                'fails domain validation with the error Expected the first '
                'part of score_category to be among allowed choices, '
                'received invalid\']]'
            ) % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_target_type(self):
        expected_output = [
            (
                u'[u\'failed validation check for target type check '
                'of GeneralSuggestionModel\', [u\'Entity id %s: Target '
                'type exploration is not allowed\']]'
            ) % self.model_instance.id]
        with self.swap(
            suggestion_validators, 'TARGET_TYPE_TO_TARGET_MODEL', {}):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_validate_score_category_for_question_suggestion(self):
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        skill = skill_domain.Skill.create_default_skill(
            '0', 'skill_description', rubrics)
        skill_services.save_new_skill(self.owner_id, skill)

        change = {
            'cmd': question_domain.CMD_CREATE_NEW_FULLY_SPECIFIED_QUESTION,
            'question_dict': {
                'question_state_data': self._create_valid_question_data(
                    'default_state').to_dict(),
                'language_code': 'en',
                'question_state_data_schema_version': (
                    feconf.CURRENT_STATE_SCHEMA_VERSION),
                'linked_skill_ids': ['0'],
                'inapplicable_skill_misconception_ids': ['skillid12345-0']
            },
            'skill_id': '0',
            'skill_difficulty': 0.3,
        }

        score_category = (
            suggestion_models.SCORE_TYPE_QUESTION +
            suggestion_models.SCORE_CATEGORY_DELIMITER + 'invalid_sub_category')

        thread_id = feedback_services.create_thread(
            'skill', '0', self.owner_id, 'description',
            'suggestion', has_suggestion=True)

        suggestion_models.GeneralSuggestionModel.create(
            suggestion_models.SUGGESTION_TYPE_ADD_QUESTION,
            suggestion_models.TARGET_TYPE_SKILL, '0',
            1, suggestion_models.STATUS_ACCEPTED, self.owner_id,
            self.admin_id, change, score_category, thread_id, 'en')
        model_instance = (
            suggestion_models.GeneralSuggestionModel.get_by_id(thread_id))
        expected_output = [(
            u'[u\'failed validation check for score category check of '
            'GeneralSuggestionModel\', [u\'Entity id %s: Score category'
            ' question.invalid_sub_category is invalid\']]') % (
                model_instance.id),
                           u'[u\'fully-validated GeneralSuggestionModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)
