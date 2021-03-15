# coding: utf-8
#
# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Unit tests for core.domain.prod_validators."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from constants import constants
from core.domain import prod_validation_jobs_one_off
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import story_domain
from core.domain import story_services
from core.domain import subtopic_page_domain
from core.domain import topic_domain
from core.domain import topic_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

datastore_services = models.Registry.import_datastore_services()

USER_EMAIL = 'useremail@example.com'
USER_NAME = 'username'

(
    subtopic_models, topic_models, user_models
) = models.Registry.import_models([
    models.NAMES.subtopic, models.NAMES.topic, models.NAMES.user
])


class SubtopicPageModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(SubtopicPageModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        topics = [topic_domain.Topic.create_default_topic(
            '%s' % i,
            'topic%s' % i,
            'abbrev-%s' % chr(120 + i),
            'description%s' % i) for i in python_utils.RANGE(3)]
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        skills = [
            skill_domain.Skill.create_default_skill(
                '%s' % i, 'skill%s' % i, rubrics)
            for i in python_utils.RANGE(9)]

        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            'title %d',
            'description %d' % i,
            '%s' % (python_utils.divide(i, 2)),
            'title-%s' % chr(97 + i)
        ) for i in python_utils.RANGE(6)]

        for story in stories:
            story_services.save_new_story(self.owner_id, story)

        language_codes = ['ar', 'en', 'en']
        for index, topic in enumerate(topics):
            topic.language_code = language_codes[index]
            topic.add_additional_story('%s' % (index * 2))
            topic.add_canonical_story('%s' % (index * 2 + 1))
            topic.add_uncategorized_skill_id('%s' % (index * 3))
            topic.add_uncategorized_skill_id('%s' % (index * 3 + 1))
            topic.add_uncategorized_skill_id('%s' % (index * 3 + 2))
            topic_services.save_new_topic(self.owner_id, topic)
            topic_services.update_topic_and_subtopic_pages(
                self.owner_id, '%s' % index, [topic_domain.TopicChange({
                    'cmd': 'add_subtopic',
                    'title': 'subtopic1',
                    'subtopic_id': 1
                }), topic_domain.TopicChange({
                    'cmd': 'move_skill_id_to_subtopic',
                    'old_subtopic_id': None,
                    'new_subtopic_id': 1,
                    'skill_id': '%s' % (index * 3)
                }), topic_domain.TopicChange({
                    'cmd': 'move_skill_id_to_subtopic',
                    'old_subtopic_id': None,
                    'new_subtopic_id': 1,
                    'skill_id': '%s' % (index * 3 + 1)
                })], 'Changes.')

        self.model_instance_0 = (
            subtopic_models.SubtopicPageModel.get_by_id('0-1'))
        self.model_instance_1 = (
            subtopic_models.SubtopicPageModel.get_by_id('1-1'))
        self.model_instance_2 = (
            subtopic_models.SubtopicPageModel.get_by_id('2-1'))

        self.job_class = (
            prod_validation_jobs_one_off.SubtopicPageModelAuditOneOffJob)

    def test_standard_operation(self):
        topic_services.update_topic_and_subtopic_pages(
            self.owner_id, '0', [subtopic_page_domain.SubtopicPageChange({
                'cmd': 'update_subtopic_page_property',
                'property_name': 'page_contents_html',
                'subtopic_id': 1,
                'new_value': {
                    'html': '<p>html</p>',
                    'content_id': 'content'
                },
                'old_value': {}
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated SubtopicPageModel\', 3]']
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
                'of SubtopicPageModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance_0.id,
                    self.model_instance_0.created_on,
                    self.model_instance_0.last_updated
                ),
            u'[u\'fully-validated SubtopicPageModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.model_instance_2.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [
            '[u\'fully-validated SubtopicPageModel\', 2]',
            (
                '[u\'failed validation check for current time check of '
                'SubtopicPageModel\', '
                '[u\'Entity id %s: The last_updated field has a '
                'value %s which is greater '
                'than the time when the job was run\']]'
            ) % (self.model_instance_0.id, self.model_instance_0.last_updated)
        ]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_subtopic_page_schema(self):
        self.model_instance_0.language_code = 'ar'
        self.model_instance_0.commit(self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'SubtopicPageModel\', '
                '[u\'Entity id %s: Entity fails domain validation with the '
                'error Invalid language code: %s\']]'
            ) % (self.model_instance_0.id, self.model_instance_0.language_code),
            u'[u\'fully-validated SubtopicPageModel\', 2]']
        with self.swap(
            constants, 'SUPPORTED_CONTENT_LANGUAGES', [{
                'code': 'en', 'description': 'English'}]):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_topic_model_failure(self):
        topic_models.TopicModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for topic_ids field '
                'check of SubtopicPageModel\', '
                '[u"Entity id 0-1: based on field topic_ids having value '
                '0, expected model TopicModel with id 0 but it '
                'doesn\'t exist"]]'),
            u'[u\'fully-validated SubtopicPageModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_subtopic_page_commit_log_entry_model_failure(self):
        topic_services.update_topic_and_subtopic_pages(
            self.owner_id, '0', [subtopic_page_domain.SubtopicPageChange({
                'cmd': 'update_subtopic_page_property',
                'property_name': 'page_contents_html',
                'subtopic_id': 1,
                'new_value': {
                    'html': '<p>html</p>',
                    'content_id': 'content'
                },
                'old_value': {}
            })], 'Changes.')
        subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
            'subtopicpage-0-1-1').delete()

        expected_output = [
            (
                u'[u\'failed validation check for '
                'subtopic_page_commit_log_entry_ids field check of '
                'SubtopicPageModel\', '
                '[u"Entity id 0-1: based on field '
                'subtopic_page_commit_log_entry_ids having value '
                'subtopicpage-0-1-1, expected model '
                'SubtopicPageCommitLogEntryModel '
                'with id subtopicpage-0-1-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated SubtopicPageModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_metadata_model_failure(self):
        subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
            '0-1-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of SubtopicPageModel\', '
                '[u"Entity id 0-1: based on field snapshot_metadata_ids having '
                'value 0-1-1, expected model SubtopicPageSnapshotMetadataModel '
                'with id 0-1-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated SubtopicPageModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_content_model_failure(self):
        subtopic_models.SubtopicPageSnapshotContentModel.get_by_id(
            '0-1-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of SubtopicPageModel\', '
                '[u"Entity id 0-1: based on field snapshot_content_ids having '
                'value 0-1-1, expected model SubtopicPageSnapshotContentModel '
                'with id 0-1-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated SubtopicPageModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class SubtopicPageSnapshotMetadataModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(SubtopicPageSnapshotMetadataModelValidatorTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        topics = [topic_domain.Topic.create_default_topic(
            '%s' % i,
            'topic%s' % i,
            'abbrev-%s' % chr(120 + i),
            'description%s' % i) for i in python_utils.RANGE(3)]
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        skills = [
            skill_domain.Skill.create_default_skill(
                '%s' % i, 'skill%s' % i, rubrics)
            for i in python_utils.RANGE(9)]

        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            'title %d',
            'description %d' % i,
            '%s' % (python_utils.divide(i, 2)),
            'title-%s' % chr(97 + i)
        ) for i in python_utils.RANGE(6)]

        for story in stories:
            story_services.save_new_story(self.owner_id, story)

        language_codes = ['ar', 'en', 'en']
        for index, topic in enumerate(topics):
            topic.language_code = language_codes[index]
            topic.add_additional_story('%s' % (index * 2))
            topic.add_canonical_story('%s' % (index * 2 + 1))
            topic.add_uncategorized_skill_id('%s' % (index * 3))
            topic.add_uncategorized_skill_id('%s' % (index * 3 + 1))
            topic.add_uncategorized_skill_id('%s' % (index * 3 + 2))
            topic_services.save_new_topic(self.owner_id, topic)
            if index == 0:
                committer_id = self.user_id
            else:
                committer_id = self.owner_id
            topic_services.update_topic_and_subtopic_pages(
                committer_id, '%s' % index, [topic_domain.TopicChange({
                    'cmd': 'add_subtopic',
                    'title': 'subtopic1',
                    'subtopic_id': 1
                }), topic_domain.TopicChange({
                    'cmd': 'move_skill_id_to_subtopic',
                    'old_subtopic_id': None,
                    'new_subtopic_id': 1,
                    'skill_id': '%s' % (index * 3)
                }), topic_domain.TopicChange({
                    'cmd': 'move_skill_id_to_subtopic',
                    'old_subtopic_id': None,
                    'new_subtopic_id': 1,
                    'skill_id': '%s' % (index * 3 + 1)
                })], 'Changes.')

        self.model_instance_0 = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '0-1-1'))
        self.model_instance_1 = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '1-1-1'))
        self.model_instance_2 = (
            subtopic_models.SubtopicPageSnapshotMetadataModel.get_by_id(
                '2-1-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .SubtopicPageSnapshotMetadataModelAuditOneOffJob)

    def test_standard_operation(self):
        topic_services.update_topic_and_subtopic_pages(
            self.owner_id, '0', [subtopic_page_domain.SubtopicPageChange({
                'cmd': 'update_subtopic_page_property',
                'property_name': 'page_contents_html',
                'subtopic_id': 1,
                'new_value': {
                    'html': '<p>html</p>',
                    'content_id': 'content'
                },
                'old_value': {}
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated SubtopicPageSnapshotMetadataModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_committer_id_migration_bot(self):
        self.model_instance_1.committer_id = feconf.MIGRATION_BOT_USER_ID
        self.model_instance_1.update_timestamps(update_last_updated_time=False)
        self.model_instance_1.put()

        expected_output = [
            u'[u\'fully-validated SubtopicPageSnapshotMetadataModel\', 3]'
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_pseudo_committer_id(self):
        self.model_instance_1.committer_id = self.PSEUDONYMOUS_ID
        self.model_instance_1.update_timestamps(update_last_updated_time=False)
        self.model_instance_1.put()

        expected_output = [
            u'[u\'fully-validated SubtopicPageSnapshotMetadataModel\', 3]'
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
            'of SubtopicPageSnapshotMetadataModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'SubtopicPageSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'SubtopicPageSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_subtopic_page_model_failure(self):
        subtopic_models.SubtopicPageModel.get_by_id('0-1').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for subtopic_page_ids '
                'field check of SubtopicPageSnapshotMetadataModel\', '
                '[u"Entity id 0-1-1: based on field subtopic_page_ids '
                'having value 0-1, expected model SubtopicPageModel with '
                'id 0-1 but it doesn\'t exist", u"Entity id 0-1-2: based '
                'on field subtopic_page_ids having value 0-1, expected model '
                'SubtopicPageModel with id 0-1 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'SubtopicPageSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, literal_eval=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of SubtopicPageSnapshotMetadataModel\', '
                '[u"Entity id 0-1-1: based on field committer_ids having '
                'value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'SubtopicPageSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_subtopic_page_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            subtopic_models.SubtopicPageSnapshotMetadataModel(
                id='0-1-3', committer_id=self.owner_id, commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for subtopic page model '
                'version check of SubtopicPageSnapshotMetadataModel\', '
                '[u\'Entity id 0-1-3: SubtopicPage model corresponding to '
                'id 0-1 has a version 1 which is less than the version 3 in '
                'snapshot metadata model id\']]'
            ), (
                u'[u\'fully-validated SubtopicPageSnapshotMetadataModel\', '
                '3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'create_new',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd create_new '
                'check of SubtopicPageSnapshotMetadataModel\', '
                '[u"Entity id 0-1-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'create_new\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with error: '
                'The following required attributes are missing: '
                'subtopic_id, topic_id, The following extra attributes '
                'are present: invalid_attribute"]]'
            ), u'[u\'fully-validated SubtopicPageSnapshotMetadataModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class SubtopicPageSnapshotContentModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(SubtopicPageSnapshotContentModelValidatorTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        topics = [topic_domain.Topic.create_default_topic(
            '%s' % i,
            'topic%s' % i,
            'abbrev-%s' % chr(120 + i),
            'description%s' % i) for i in python_utils.RANGE(3)]
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        skills = [
            skill_domain.Skill.create_default_skill(
                '%s' % i, 'skill%s' % i, rubrics)
            for i in python_utils.RANGE(9)]

        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            'title %d',
            'description %d' % i,
            '%s' % (python_utils.divide(i, 2)),
            'title-%s' % chr(97 + i)
        ) for i in python_utils.RANGE(6)]

        for story in stories:
            story_services.save_new_story(self.owner_id, story)

        language_codes = ['ar', 'en', 'en']
        for index, topic in enumerate(topics):
            topic.language_code = language_codes[index]
            topic.add_additional_story('%s' % (index * 2))
            topic.add_canonical_story('%s' % (index * 2 + 1))
            topic.add_uncategorized_skill_id('%s' % (index * 3))
            topic.add_uncategorized_skill_id('%s' % (index * 3 + 1))
            topic.add_uncategorized_skill_id('%s' % (index * 3 + 2))
            topic_services.save_new_topic(self.owner_id, topic)
            topic_services.update_topic_and_subtopic_pages(
                self.owner_id, '%s' % index, [topic_domain.TopicChange({
                    'cmd': 'add_subtopic',
                    'title': 'subtopic1',
                    'subtopic_id': 1
                }), topic_domain.TopicChange({
                    'cmd': 'move_skill_id_to_subtopic',
                    'old_subtopic_id': None,
                    'new_subtopic_id': 1,
                    'skill_id': '%s' % (index * 3)
                }), topic_domain.TopicChange({
                    'cmd': 'move_skill_id_to_subtopic',
                    'old_subtopic_id': None,
                    'new_subtopic_id': 1,
                    'skill_id': '%s' % (index * 3 + 1)
                })], 'Changes.')

        self.model_instance_0 = (
            subtopic_models.SubtopicPageSnapshotContentModel.get_by_id(
                '0-1-1'))
        self.model_instance_1 = (
            subtopic_models.SubtopicPageSnapshotContentModel.get_by_id(
                '1-1-1'))
        self.model_instance_2 = (
            subtopic_models.SubtopicPageSnapshotContentModel.get_by_id(
                '2-1-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .SubtopicPageSnapshotContentModelAuditOneOffJob)

    def test_standard_operation(self):
        topic_services.update_topic_and_subtopic_pages(
            self.owner_id, '0', [subtopic_page_domain.SubtopicPageChange({
                'cmd': 'update_subtopic_page_property',
                'property_name': 'page_contents_html',
                'subtopic_id': 1,
                'new_value': {
                    'html': '<p>html</p>',
                    'content_id': 'content'
                },
                'old_value': {}
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated SubtopicPageSnapshotContentModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of SubtopicPageSnapshotContentModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'SubtopicPageSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'SubtopicPageSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_subtopic_page_model_failure(self):
        subtopic_models.SubtopicPageModel.get_by_id('0-1').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for subtopic_page_ids '
                'field check of SubtopicPageSnapshotContentModel\', '
                '[u"Entity id 0-1-1: based on field subtopic_page_ids '
                'having value 0-1, expected model SubtopicPageModel with '
                'id 0-1 but it doesn\'t exist", u"Entity id 0-1-2: based '
                'on field subtopic_page_ids having value 0-1, expected model '
                'SubtopicPageModel with id 0-1 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'SubtopicPageSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, literal_eval=True)

    def test_invalid_subtopic_page_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            subtopic_models.SubtopicPageSnapshotContentModel(id='0-1-3'))
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for subtopic page model '
                'version check of SubtopicPageSnapshotContentModel\', '
                '[u\'Entity id 0-1-3: SubtopicPage model corresponding to '
                'id 0-1 has a version 1 which is less than the version 3 in '
                'snapshot content model id\']]'
            ), (
                u'[u\'fully-validated SubtopicPageSnapshotContentModel\', '
                '3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class SubtopicPageCommitLogEntryModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(SubtopicPageCommitLogEntryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        topics = [topic_domain.Topic.create_default_topic(
            '%s' % i,
            'topic%s' % i,
            'abbrev-%s' % chr(120 + i),
            'description%s' % i) for i in python_utils.RANGE(3)]
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        skills = [
            skill_domain.Skill.create_default_skill(
                '%s' % i, 'skill%s' % i, rubrics)
            for i in python_utils.RANGE(9)]

        for skill in skills:
            skill_services.save_new_skill(self.owner_id, skill)

        stories = [story_domain.Story.create_default_story(
            '%s' % i,
            'title %d',
            'description %d' % i,
            '%s' % (python_utils.divide(i, 2)),
            'title-%s' % chr(97 + i)
        ) for i in python_utils.RANGE(6)]

        for story in stories:
            story_services.save_new_story(self.owner_id, story)

        language_codes = ['ar', 'en', 'en']
        for index, topic in enumerate(topics):
            topic.language_code = language_codes[index]
            topic.add_additional_story('%s' % (index * 2))
            topic.add_canonical_story('%s' % (index * 2 + 1))
            topic.add_uncategorized_skill_id('%s' % (index * 3))
            topic.add_uncategorized_skill_id('%s' % (index * 3 + 1))
            topic.add_uncategorized_skill_id('%s' % (index * 3 + 2))
            topic_services.save_new_topic(self.owner_id, topic)
            if index == 0:
                committer_id = self.user_id
            else:
                committer_id = self.owner_id
            topic_services.update_topic_and_subtopic_pages(
                committer_id, '%s' % index, [topic_domain.TopicChange({
                    'cmd': 'add_subtopic',
                    'title': 'subtopic1',
                    'subtopic_id': 1
                }), topic_domain.TopicChange({
                    'cmd': 'move_skill_id_to_subtopic',
                    'old_subtopic_id': None,
                    'new_subtopic_id': 1,
                    'skill_id': '%s' % (index * 3)
                }), topic_domain.TopicChange({
                    'cmd': 'move_skill_id_to_subtopic',
                    'old_subtopic_id': None,
                    'new_subtopic_id': 1,
                    'skill_id': '%s' % (index * 3 + 1)
                })], 'Changes.')

        self.model_instance_0 = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-0-1-1'))
        self.model_instance_1 = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-1-1-1'))
        self.model_instance_2 = (
            subtopic_models.SubtopicPageCommitLogEntryModel.get_by_id(
                'subtopicpage-2-1-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .SubtopicPageCommitLogEntryModelAuditOneOffJob)

    def test_standard_operation(self):
        topic_services.update_topic_and_subtopic_pages(
            self.owner_id, '0', [subtopic_page_domain.SubtopicPageChange({
                'cmd': 'update_subtopic_page_property',
                'property_name': 'page_contents_html',
                'subtopic_id': 1,
                'new_value': {
                    'html': '<p>html</p>',
                    'content_id': 'content'
                },
                'old_value': {}
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated SubtopicPageCommitLogEntryModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_user_id_migration_bot(self):
        self.model_instance_1.user_id = feconf.MIGRATION_BOT_USER_ID
        self.model_instance_1.update_timestamps(update_last_updated_time=False)
        self.model_instance_1.put()

        expected_output = [
            u'[u\'fully-validated SubtopicPageCommitLogEntryModel\', 3]'
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_pseudo_user_id(self):
        self.model_instance_1.user_id = self.PSEUDONYMOUS_ID
        self.model_instance_1.update_timestamps(update_last_updated_time=False)
        self.model_instance_1.put()

        expected_output = [
            u'[u\'fully-validated SubtopicPageCommitLogEntryModel\', 3]'
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
            'of SubtopicPageCommitLogEntryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated SubtopicPageCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'SubtopicPageCommitLogEntryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_subtopic_page_model_failure(self):
        subtopic_models.SubtopicPageModel.get_by_id('0-1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for subtopic_page_ids '
                'field check of SubtopicPageCommitLogEntryModel\', '
                '[u"Entity id subtopicpage-0-1-1: based on field '
                'subtopic_page_ids having value 0-1, expected model '
                'SubtopicPageModel with id 0-1 but it doesn\'t exist", '
                'u"Entity id subtopicpage-0-1-2: based on field '
                'subtopic_page_ids having value 0-1, expected model '
                'SubtopicPageModel with id 0-1 but it doesn\'t exist"]]'
            ), u'[u\'fully-validated SubtopicPageCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)

    def test_invalid_topic_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            subtopic_models.SubtopicPageCommitLogEntryModel.create(
                '0-1', 3, self.owner_id, 'edit', 'msg', [{}],
                constants.ACTIVITY_STATUS_PUBLIC, False))
        model_with_invalid_version_in_id.subtopic_page_id = '0-1'
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for subtopic page model '
                'version check of SubtopicPageCommitLogEntryModel\', '
                '[u\'Entity id %s: SubtopicPage model corresponding '
                'to id 0-1 has a version 1 which is less than '
                'the version 3 in commit log entry model id\']]'
            ) % (model_with_invalid_version_in_id.id),
            u'[u\'fully-validated SubtopicPageCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_id(self):
        model_with_invalid_id = (
            subtopic_models.SubtopicPageCommitLogEntryModel(
                id='invalid-0-1-1',
                user_id=self.owner_id,
                commit_type='edit',
                commit_message='msg',
                commit_cmds=[{}],
                post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
                post_commit_is_private=False))
        model_with_invalid_id.subtopic_page_id = '0-1'
        model_with_invalid_id.update_timestamps()
        model_with_invalid_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for model id check of '
                'SubtopicPageCommitLogEntryModel\', '
                '[u\'Entity id %s: Entity id does not match regex pattern\']]'
            ) % (model_with_invalid_id.id), (
                u'[u\'failed validation check for commit cmd check of '
                'SubtopicPageCommitLogEntryModel\', [u\'Entity id '
                'invalid-0-1-1: No commit command domain object defined '
                'for entity with commands: [{}]\']]'),
            u'[u\'fully-validated SubtopicPageCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_type(self):
        self.model_instance_0.commit_type = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit type check of '
                'SubtopicPageCommitLogEntryModel\', '
                '[u\'Entity id subtopicpage-0-1-1: Commit type invalid is '
                'not allowed\']]'
            ), u'[u\'fully-validated SubtopicPageCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_post_commit_status(self):
        self.model_instance_0.post_commit_status = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for post commit status check '
                'of SubtopicPageCommitLogEntryModel\', '
                '[u\'Entity id subtopicpage-0-1-1: Post commit status invalid '
                'is invalid\']]'
            ), u'[u\'fully-validated SubtopicPageCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_true_post_commit_is_private(self):
        self.model_instance_0.post_commit_status = 'public'
        self.model_instance_0.post_commit_is_private = True
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()

        expected_output = [
            (
                u'[u\'failed validation check for post commit is private '
                'check of SubtopicPageCommitLogEntryModel\', '
                '[u\'Entity id %s: Post commit status is '
                'public but post_commit_is_private is True\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated SubtopicPageCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_false_post_commit_is_private(self):
        self.model_instance_0.post_commit_status = 'private'
        self.model_instance_0.post_commit_is_private = False
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()

        expected_output = [
            (
                u'[u\'failed validation check for post commit is private '
                'check of SubtopicPageCommitLogEntryModel\', '
                '[u\'Entity id %s: Post commit status is '
                'private but post_commit_is_private is False\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated SubtopicPageCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'create_new',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd create_new '
                'check of SubtopicPageCommitLogEntryModel\', '
                '[u"Entity id subtopicpage-0-1-1: Commit command domain '
                'validation for command: {u\'cmd\': u\'create_new\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with error: '
                'The following required attributes are missing: '
                'subtopic_id, topic_id, The following extra attributes '
                'are present: invalid_attribute"]]'
            ), u'[u\'fully-validated SubtopicPageCommitLogEntryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)
