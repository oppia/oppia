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

"""Unit tests for core.domain.topic_validators."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from constants import constants
from core.domain import prod_validation_jobs_one_off
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import story_domain
from core.domain import story_services
from core.domain import topic_domain
from core.domain import topic_fetchers
from core.domain import topic_services
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils

datastore_services = models.Registry.import_datastore_services()

USER_EMAIL = 'useremail@example.com'
USER_NAME = 'username'

(
    skill_models, story_models, subtopic_models, topic_models, user_models
) = models.Registry.import_models([
    models.NAMES.skill, models.NAMES.story, models.NAMES.subtopic,
    models.NAMES.topic, models.NAMES.user
])


class TopicModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(TopicModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        topics = [topic_domain.Topic.create_default_topic(
            '%s' % i,
            'Topic%s' % i,
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
                '%s' % i,
                'skill%s' % i, rubrics)
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

        self.model_instance_0 = topic_models.TopicModel.get_by_id('0')
        self.model_instance_1 = topic_models.TopicModel.get_by_id('1')
        self.model_instance_2 = topic_models.TopicModel.get_by_id('2')

        self.job_class = (
            prod_validation_jobs_one_off.TopicModelAuditOneOffJob)

    def test_standard_operation(self):
        topic_services.update_topic_and_subtopic_pages(
            self.owner_id, '0', [topic_domain.TopicChange({
                'cmd': 'update_topic_property',
                'property_name': 'description',
                'new_value': 'new description',
                'old_value': None
            })], 'Changes.')

        expected_output = [
            u'[u\'fully-validated TopicModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.commit(
            feconf.SYSTEM_COMMITTER_ID, 'created_on test', [])
        expected_output = [
            u'[u\'fully-validated TopicModel\', 2]',
            (
                u'[u\'failed validation check for time field relation check '
                'of TopicModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]'
            ) % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            )
        ]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.model_instance_2.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [
            u'[u\'fully-validated TopicModel\', 2]',
            (
                u'[u\'failed validation check for current time check of '
                'TopicModel\', '
                '[u\'Entity id %s: The last_updated field has a value '
                '%s which is greater than the time when the job was run\']]'
            ) % (self.model_instance_0.id, self.model_instance_0.last_updated)
        ]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_topic_schema(self):
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'TopicModel\', '
                '[u\'Entity id %s: Entity fails domain validation with the '
                'error Invalid language code: %s\']]'
            ) % (self.model_instance_0.id, self.model_instance_0.language_code),
            u'[u\'fully-validated TopicModel\', 2]']
        with self.swap(
            constants, 'SUPPORTED_CONTENT_LANGUAGES', [{
                'code': 'en', 'description': 'English'}]):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_private_topic_with_missing_thumbnail_filename(self):
        expected_output = [
            u'[u\'fully-validated TopicModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_public_topic_with_missing_thumbnail_filename(self):
        topic_rights = topic_fetchers.get_topic_rights('0', strict=False)
        topic_rights.topic_is_published = True
        commit_cmds = [topic_domain.TopicRightsChange({
            'cmd': topic_domain.CMD_PUBLISH_TOPIC
        })]
        topic_services.save_topic_rights(
            topic_rights, self.owner_id, 'Published the topic', commit_cmds)

        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'TopicModel\', [u\'Entity id 0: Entity fails '
                'domain validation with the error Expected thumbnail filename '
                'to be a string, received None.\']]'
            ),
            u'[u\'fully-validated TopicModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_story_model_failure(self):
        story_models.StoryModel.get_by_id('1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for story_ids field '
                'check of TopicModel\', '
                '[u"Entity id 0: based on field story_ids having value '
                '1, expected model StoryModel with id 1 but it '
                'doesn\'t exist"]]'),
            u'[u\'fully-validated TopicModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_skill_model_failure(self):
        skill_models.SkillModel.get_by_id('1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for skill_ids field '
                'check of TopicModel\', '
                '[u"Entity id 0: based on field skill_ids having value '
                '1, expected model SkillModel with id 1 but it '
                'doesn\'t exist"]]'),
            u'[u\'fully-validated TopicModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_subtopic_page_model_failure(self):
        subtopic_models.SubtopicPageModel.get_by_id('0-1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for subtopic_page_ids field '
                'check of TopicModel\', '
                '[u"Entity id 0: based on field subtopic_page_ids having value '
                '0-1, expected model SubtopicPageModel with id 0-1 but it '
                'doesn\'t exist"]]'),
            u'[u\'fully-validated TopicModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_topic_commit_log_entry_model_failure(self):
        topic_services.update_topic_and_subtopic_pages(
            self.owner_id, '0', [topic_domain.TopicChange({
                'cmd': 'update_topic_property',
                'property_name': 'description',
                'new_value': 'new description',
                'old_value': None
            })], 'Changes.')
        topic_models.TopicCommitLogEntryModel.get_by_id(
            'topic-0-1').delete()

        expected_output = [
            (
                u'[u\'failed validation check for '
                'topic_commit_log_entry_ids field check of '
                'TopicModel\', '
                '[u"Entity id 0: based on field '
                'topic_commit_log_entry_ids having value '
                'topic-0-1, expected model TopicCommitLogEntryModel '
                'with id topic-0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated TopicModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_summary_model_failure(self):
        topic_models.TopicSummaryModel.get_by_id('0').delete()

        expected_output = [
            (
                u'[u\'failed validation check for topic_summary_ids '
                'field check of TopicModel\', '
                '[u"Entity id 0: based on field topic_summary_ids having '
                'value 0, expected model TopicSummaryModel with id 0 '
                'but it doesn\'t exist"]]'),
            u'[u\'fully-validated TopicModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_topic_rights_model_failure(self):
        topic_models.TopicRightsModel.get_by_id(
            '0').delete(feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for topic_rights_ids '
                'field check of TopicModel\', '
                '[u"Entity id 0: based on field topic_rights_ids having '
                'value 0, expected model TopicRightsModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated TopicModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_metadata_model_failure(self):
        topic_models.TopicSnapshotMetadataModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of TopicModel\', '
                '[u"Entity id 0: based on field snapshot_metadata_ids having '
                'value 0-1, expected model TopicSnapshotMetadataModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated TopicModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_content_model_failure(self):
        topic_models.TopicSnapshotContentModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of TopicModel\', '
                '[u"Entity id 0: based on field snapshot_content_ids having '
                'value 0-1, expected model TopicSnapshotContentModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated TopicModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_repeated_name(self):
        self.model_instance_0.name = 'Topic1'
        self.model_instance_0.canonical_name = 'topic1'
        self.model_instance_0.commit(self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for unique name check '
                'of TopicModel\', [u"Entity id 0: canonical name topic1 '
                'matches with canonical name of topic models with ids '
                '[\'1\']", u"Entity id 1: canonical name topic1 matches '
                'with canonical name of topic models with ids [\'0\']"]]'
            ), u'[u\'fully-validated TopicModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)

    def test_model_with_canonical_name_not_matching_name_in_lowercase(self):
        self.model_instance_0.name = 'invalid'
        self.model_instance_0.commit(self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for canonical name check '
                'of TopicModel\', '
                '[u\'Entity id 0: Entity name invalid in lowercase does '
                'not match canonical name topic0\']]'
            ), u'[u\'fully-validated TopicModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_uncategorized_skill_id_in_subtopic(self):
        self.model_instance_0.uncategorized_skill_ids = ['0', '6']
        self.model_instance_0.commit(self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for uncategorized skill '
                'id check of TopicModel\', '
                '[u\'Entity id 0: uncategorized skill id 0 is present '
                'in subtopic for entity with id 1\']]'
            ), u'[u\'fully-validated TopicModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class TopicSnapshotMetadataModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(TopicSnapshotMetadataModelValidatorTests, self).setUp()
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
                '%s' % i,
                'skill%s' % i, rubrics)
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
            if index == 0:
                topic_services.save_new_topic(self.user_id, topic)
            else:
                topic_services.save_new_topic(self.owner_id, topic)

        self.model_instance_0 = (
            topic_models.TopicSnapshotMetadataModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            topic_models.TopicSnapshotMetadataModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            topic_models.TopicSnapshotMetadataModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .TopicSnapshotMetadataModelAuditOneOffJob)

    def test_standard_operation(self):
        topic_services.update_topic_and_subtopic_pages(
            self.owner_id, '0', [topic_domain.TopicChange({
                'cmd': 'update_topic_property',
                'property_name': 'description',
                'new_value': 'new description',
                'old_value': None
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated TopicSnapshotMetadataModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_committer_id_migration_bot(self):
        self.model_instance_1.committer_id = feconf.MIGRATION_BOT_USER_ID
        self.model_instance_1.update_timestamps(update_last_updated_time=False)
        self.model_instance_1.put()
        expected_output = [
            u'[u\'fully-validated TopicSnapshotMetadataModel\', 3]']

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_pseudo_committer_id(self):
        self.model_instance_1.committer_id = self.PSEUDONYMOUS_ID
        self.model_instance_1.update_timestamps(update_last_updated_time=False)
        self.model_instance_1.put()
        expected_output = [
            u'[u\'fully-validated TopicSnapshotMetadataModel\', 3]']

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of TopicSnapshotMetadataModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'TopicSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'TopicSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_topic_model_failure(self):
        topic_models.TopicModel.get_by_id('0').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for topic_ids '
                'field check of TopicSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field topic_ids '
                'having value 0, expected model TopicModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'topic_ids having value 0, expected model '
                'TopicModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'TopicSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, literal_eval=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of TopicSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field committer_ids having '
                'value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'TopicSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_topic_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            topic_models.TopicSnapshotMetadataModel(
                id='0-3', committer_id=self.owner_id, commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for topic model '
                'version check of TopicSnapshotMetadataModel\', '
                '[u\'Entity id 0-3: Topic model corresponding to '
                'id 0 has a version 1 which is less than the version 3 in '
                'snapshot metadata model id\']]'
            ), (
                u'[u\'fully-validated TopicSnapshotMetadataModel\', '
                '3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'add_subtopic'
        }, {
            'cmd': 'delete_subtopic',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'delete_subtopic check of '
                'TopicSnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'delete_subtopic\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with error: '
                'The following required attributes are missing: '
                'subtopic_id, The following extra attributes are present: '
                'invalid_attribute"]]'
            ), (
                u'[u\'failed validation check for commit cmd add_subtopic '
                'check of TopicSnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'add_subtopic\'} '
                'failed with error: The following required attributes '
                'are missing: subtopic_id, title"]]'
            ), u'[u\'fully-validated TopicSnapshotMetadataModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class TopicSnapshotContentModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(TopicSnapshotContentModelValidatorTests, self).setUp()

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

        self.model_instance_0 = (
            topic_models.TopicSnapshotContentModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            topic_models.TopicSnapshotContentModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            topic_models.TopicSnapshotContentModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .TopicSnapshotContentModelAuditOneOffJob)

    def test_standard_operation(self):
        topic_services.update_topic_and_subtopic_pages(
            self.owner_id, '0', [topic_domain.TopicChange({
                'cmd': 'update_topic_property',
                'property_name': 'description',
                'new_value': 'new description',
                'old_value': None
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated TopicSnapshotContentModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of TopicSnapshotContentModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'TopicSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'TopicSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_topic_model_failure(self):
        topic_models.TopicModel.get_by_id('0').delete(self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for topic_ids '
                'field check of TopicSnapshotContentModel\', '
                '[u"Entity id 0-1: based on field topic_ids '
                'having value 0, expected model TopicModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'topic_ids having value 0, expected model '
                'TopicModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'TopicSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_topic_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            topic_models.TopicSnapshotContentModel(
                id='0-3'))
        model_with_invalid_version_in_id.content = {}
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for topic model '
                'version check of TopicSnapshotContentModel\', '
                '[u\'Entity id 0-3: Topic model corresponding to '
                'id 0 has a version 1 which is less than '
                'the version 3 in snapshot content model id\']]'
            ), (
                u'[u\'fully-validated TopicSnapshotContentModel\', '
                '3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class TopicRightsModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(TopicRightsModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.admin = user_services.get_user_actions_info(self.admin_id)

        manager1_email = 'user@manager1.com'
        manager2_email = 'user@manager2.com'

        self.signup(manager1_email, 'manager1')
        self.signup(manager2_email, 'manager2')

        self.set_topic_managers(['manager1', 'manager2'])

        self.manager1_id = self.get_user_id_from_email(manager1_email)
        self.manager2_id = self.get_user_id_from_email(manager2_email)

        self.manager1 = user_services.get_user_actions_info(self.manager1_id)
        self.manager2 = user_services.get_user_actions_info(self.manager2_id)

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

        topic_services.assign_role(
            self.admin, self.manager1, topic_domain.ROLE_MANAGER, '0')
        topic_services.assign_role(
            self.admin, self.manager2, topic_domain.ROLE_MANAGER, '1')

        self.model_instance_0 = topic_models.TopicRightsModel.get_by_id('0')
        self.model_instance_1 = topic_models.TopicRightsModel.get_by_id('1')
        self.model_instance_2 = topic_models.TopicRightsModel.get_by_id('2')

        self.job_class = (
            prod_validation_jobs_one_off.TopicRightsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated TopicRightsModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.commit(
            feconf.SYSTEM_COMMITTER_ID, 'created_on test', [])
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of TopicRightsModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated TopicRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.model_instance_2.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [
            '[u\'fully-validated TopicRightsModel\', 2]',
            (
                u'[u\'failed validation check for current time check of '
                'TopicRightsModel\', '
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

    def test_missing_topic_model_failure(self):
        topic_models.TopicModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for topic_ids '
                'field check of TopicRightsModel\', '
                '[u"Entity id 0: based on field topic_ids having '
                'value 0, expected model TopicModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated TopicRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_manager_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.manager1_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for manager_user_ids '
                'field check of TopicRightsModel\', '
                '[u"Entity id 0: based on field manager_user_ids having '
                'value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]') % (
                    self.manager1_id, self.manager1_id),
            u'[u\'fully-validated TopicRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_metadata_model_failure(self):
        topic_models.TopicRightsSnapshotMetadataModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of TopicRightsModel\', '
                '[u"Entity id 0: based on field snapshot_metadata_ids having '
                'value 0-1, expected model '
                'TopicRightsSnapshotMetadataModel '
                'with id 0-1 but it doesn\'t exist"]]'
            ),
            u'[u\'fully-validated TopicRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_content_model_failure(self):
        topic_models.TopicRightsSnapshotContentModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of TopicRightsModel\', '
                '[u"Entity id 0: based on field snapshot_content_ids having '
                'value 0-1, expected model TopicRightsSnapshotContentModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated TopicRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class TopicRightsSnapshotMetadataModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(TopicRightsSnapshotMetadataModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

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
            if index == 0:
                topic_services.save_new_topic(self.user_id, topic)
            else:
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
            topic_models.TopicRightsSnapshotMetadataModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            topic_models.TopicRightsSnapshotMetadataModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            topic_models.TopicRightsSnapshotMetadataModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .TopicRightsSnapshotMetadataModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated TopicRightsSnapshotMetadataModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_committer_id_migration_bot(self):
        self.model_instance_1.committer_id = feconf.MIGRATION_BOT_USER_ID
        self.model_instance_1.update_timestamps(update_last_updated_time=False)
        self.model_instance_1.put()

        expected_output = [
            u'[u\'fully-validated TopicRightsSnapshotMetadataModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_pseudo_committer_id(self):
        self.model_instance_1.committer_id = self.PSEUDONYMOUS_ID
        self.model_instance_1.update_timestamps(update_last_updated_time=False)
        self.model_instance_1.put()
        expected_output = [
            u'[u\'fully-validated TopicRightsSnapshotMetadataModel\', 3]']

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of TopicRightsSnapshotMetadataModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'TopicRightsSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'TopicRightsSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_topic_rights_model_failure(self):
        topic_models.TopicRightsModel.get_by_id('0').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for topic_rights_ids '
                'field check of TopicRightsSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field topic_rights_ids '
                'having value 0, expected model TopicRightsModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'topic_rights_ids having value 0, expected model '
                'TopicRightsModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'TopicRightsSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of TopicRightsSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field committer_ids having '
                'value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'TopicRightsSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_topic_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            topic_models.TopicRightsSnapshotMetadataModel(
                id='0-3', committer_id=self.owner_id, commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for topic rights model '
                'version check of TopicRightsSnapshotMetadataModel\', '
                '[u\'Entity id 0-3: TopicRights model corresponding to '
                'id 0 has a version 1 which is less than the version 3 in '
                'snapshot metadata model id\']]'
            ), (
                u'[u\'fully-validated '
                'TopicRightsSnapshotMetadataModel\', 3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'change_role',
            'assignee_id': 'id',
            'new_role': 'manager'
        }, {
            'cmd': 'publish_topic',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'change_role check of '
                'TopicRightsSnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation '
                'for command: {u\'assignee_id\': u\'id\', '
                'u\'cmd\': u\'change_role\', u\'new_role\': u\'manager\'} '
                'failed with error: The following required attributes '
                'are missing: old_role"]]'
            ), (
                u'[u\'failed validation check for commit cmd publish_topic '
                'check of TopicRightsSnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'publish_topic\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with error: '
                'The following extra attributes are present: '
                'invalid_attribute"]]'
            ), u'[u\'fully-validated TopicRightsSnapshotMetadataModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class TopicRightsSnapshotContentModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(TopicRightsSnapshotContentModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

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
            topic_models.TopicRightsSnapshotContentModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            topic_models.TopicRightsSnapshotContentModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            topic_models.TopicRightsSnapshotContentModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .TopicRightsSnapshotContentModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated TopicRightsSnapshotContentModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of TopicRightsSnapshotContentModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'TopicRightsSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'TopicRightsSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_topic_model_failure(self):
        topic_models.TopicRightsModel.get_by_id('0').delete(
            self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for topic_rights_ids '
                'field check of TopicRightsSnapshotContentModel\', '
                '[u"Entity id 0-1: based on field topic_rights_ids '
                'having value 0, expected model TopicRightsModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'topic_rights_ids having value 0, expected model '
                'TopicRightsModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'TopicRightsSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_topic_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            topic_models.TopicRightsSnapshotContentModel(
                id='0-3'))
        model_with_invalid_version_in_id.content = {}
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for topic rights model '
                'version check of TopicRightsSnapshotContentModel\', '
                '[u\'Entity id 0-3: TopicRights model corresponding to '
                'id 0 has a version 1 which is less than the version 3 in '
                'snapshot content model id\']]'
            ), (
                u'[u\'fully-validated TopicRightsSnapshotContentModel\', '
                '3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class TopicCommitLogEntryModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(TopicCommitLogEntryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

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
            if index == 0:
                topic_services.save_new_topic(self.user_id, topic)
            else:
                topic_services.save_new_topic(self.owner_id, topic)

        self.model_instance_0 = (
            topic_models.TopicCommitLogEntryModel.get_by_id(
                'topic-0-1'))
        self.model_instance_1 = (
            topic_models.TopicCommitLogEntryModel.get_by_id(
                'topic-1-1'))
        self.model_instance_2 = (
            topic_models.TopicCommitLogEntryModel.get_by_id(
                'topic-2-1'))
        self.rights_model_instance_0 = (
            topic_models.TopicCommitLogEntryModel.get_by_id(
                'rights-0-1'))
        self.rights_model_instance_1 = (
            topic_models.TopicCommitLogEntryModel.get_by_id(
                'rights-1-1'))
        self.rights_model_instance_2 = (
            topic_models.TopicCommitLogEntryModel.get_by_id(
                'rights-2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .TopicCommitLogEntryModelAuditOneOffJob)

    def test_standard_operation(self):
        topic_services.update_topic_and_subtopic_pages(
            self.owner_id, '0', [topic_domain.TopicChange({
                'cmd': 'update_topic_property',
                'property_name': 'description',
                'new_value': 'new description',
                'old_value': None
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated TopicCommitLogEntryModel\', 7]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_user_id_migration_bot(self):
        self.model_instance_1.user_id = feconf.MIGRATION_BOT_USER_ID
        self.model_instance_1.update_timestamps(update_last_updated_time=False)
        self.model_instance_1.put()

        expected_output = [
            u'[u\'fully-validated TopicCommitLogEntryModel\', 6]'
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_pseudo_user_id(self):
        self.model_instance_1.user_id = self.PSEUDONYMOUS_ID
        self.model_instance_1.update_timestamps(update_last_updated_time=False)
        self.model_instance_1.put()

        expected_output = [
            u'[u\'fully-validated TopicCommitLogEntryModel\', 6]'
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
            'of TopicCommitLogEntryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated TopicCommitLogEntryModel\', 5]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        self.rights_model_instance_0.delete()
        self.rights_model_instance_1.delete()
        self.rights_model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'TopicCommitLogEntryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_topic_model_failure(self):
        topic_models.TopicModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for topic_ids field check '
                'of TopicCommitLogEntryModel\', '
                '[u"Entity id rights-0-1: based on field topic_ids '
                'having value 0, expected model TopicModel with id 0 '
                'but it doesn\'t exist", u"Entity id topic-0-1: '
                'based on field topic_ids having value 0, expected model '
                'TopicModel with id 0 but it doesn\'t exist", '
                'u"Entity id topic-0-2: based on field topic_ids having '
                'value 0, expected model TopicModel with id 0 but '
                'it doesn\'t exist"]]'
            ), u'[u\'fully-validated TopicCommitLogEntryModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)

    def test_missing_topic_rights_model_failure(self):
        topic_models.TopicRightsModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for topic_rights_ids field '
                'check of TopicCommitLogEntryModel\', '
                '[u"Entity id rights-0-1: based on field topic_rights_ids '
                'having value 0, expected model TopicRightsModel with id 0 '
                'but it doesn\'t exist", u"Entity id rights-0-2: based '
                'on field topic_rights_ids having value 0, expected '
                'model TopicRightsModel with id 0 but it doesn\'t exist"]]'
            ), u'[u\'fully-validated TopicCommitLogEntryModel\', 5]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)

    def test_invalid_topic_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            topic_models.TopicCommitLogEntryModel.create(
                '0', 3, self.owner_id, 'edit', 'msg', [{}],
                constants.ACTIVITY_STATUS_PUBLIC, False))
        model_with_invalid_version_in_id.topic_id = '0'
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for topic model '
                'version check of TopicCommitLogEntryModel\', '
                '[u\'Entity id %s: Topic model corresponding '
                'to id 0 has a version 1 which is less than '
                'the version 3 in commit log entry model id\']]'
            ) % (model_with_invalid_version_in_id.id),
            u'[u\'fully-validated TopicCommitLogEntryModel\', 6]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_id(self):
        model_with_invalid_id = (
            topic_models.TopicCommitLogEntryModel(
                id='invalid-0-1',
                user_id=self.owner_id,
                commit_type='edit',
                commit_message='msg',
                commit_cmds=[{}],
                post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
                post_commit_is_private=False))
        model_with_invalid_id.topic_id = '0'
        model_with_invalid_id.update_timestamps()
        model_with_invalid_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for model id check of '
                'TopicCommitLogEntryModel\', '
                '[u\'Entity id %s: Entity id does not match regex pattern\']]'
            ) % (model_with_invalid_id.id), (
                u'[u\'failed validation check for commit cmd check of '
                'TopicCommitLogEntryModel\', [u\'Entity id invalid-0-1: '
                'No commit command domain object defined for entity with '
                'commands: [{}]\']]'),
            u'[u\'fully-validated TopicCommitLogEntryModel\', 6]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_type(self):
        self.model_instance_0.commit_type = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit type check of '
                'TopicCommitLogEntryModel\', '
                '[u\'Entity id topic-0-1: Commit type invalid is '
                'not allowed\']]'
            ), u'[u\'fully-validated TopicCommitLogEntryModel\', 5]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_post_commit_status(self):
        self.model_instance_0.post_commit_status = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for post commit status check '
                'of TopicCommitLogEntryModel\', '
                '[u\'Entity id topic-0-1: Post commit status invalid '
                'is invalid\']]'
            ), u'[u\'fully-validated TopicCommitLogEntryModel\', 5]']
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
                'check of TopicCommitLogEntryModel\', '
                '[u\'Entity id %s: Post commit status is '
                'public but post_commit_is_private is True\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated TopicCommitLogEntryModel\', 5]']
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
                'check of TopicCommitLogEntryModel\', '
                '[u\'Entity id %s: Post commit status is '
                'private but post_commit_is_private is False\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated TopicCommitLogEntryModel\', 5]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'add_subtopic'
        }, {
            'cmd': 'delete_subtopic',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'delete_subtopic check of '
                'TopicCommitLogEntryModel\', '
                '[u"Entity id topic-0-1: Commit command domain '
                'validation for command: {u\'cmd\': u\'delete_subtopic\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with error: '
                'The following required attributes are missing: subtopic_id, '
                'The following extra attributes are present: '
                'invalid_attribute"]]'
            ), (
                u'[u\'failed validation check for commit cmd '
                'add_subtopic check of TopicCommitLogEntryModel\', '
                '[u"Entity id topic-0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'add_subtopic\'} '
                'failed with error: The following required attributes '
                'are missing: subtopic_id, title"]]'
            ), u'[u\'fully-validated TopicCommitLogEntryModel\', 5]']

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class TopicSummaryModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(TopicSummaryModelValidatorTests, self).setUp()

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
            topic_services.publish_story(
                topic.id, '%s' % (index * 2 + 1), self.admin_id)
            topic_services.publish_story(
                topic.id, '%s' % (index * 2), self.admin_id)
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

        self.model_instance_0 = topic_models.TopicSummaryModel.get_by_id('0')
        self.model_instance_1 = topic_models.TopicSummaryModel.get_by_id('1')
        self.model_instance_2 = topic_models.TopicSummaryModel.get_by_id('2')

        self.job_class = (
            prod_validation_jobs_one_off.TopicSummaryModelAuditOneOffJob)

    def test_standard_operation(self):
        topic_services.update_topic_and_subtopic_pages(
            self.owner_id, '0', [topic_domain.TopicChange({
                'cmd': 'update_topic_property',
                'property_name': 'description',
                'new_value': 'new description',
                'old_value': None
            })], 'Changes.')
        expected_output = [
            u'[u\'fully-validated TopicSummaryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of TopicSummaryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated TopicSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        topic_services.delete_topic(self.owner_id, '1')
        topic_services.delete_topic(self.owner_id, '2')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'TopicSummaryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_topic_model_failure(self):
        topic_model = topic_models.TopicModel.get_by_id('0')
        topic_model.delete(feconf.SYSTEM_COMMITTER_ID, '', [])
        self.model_instance_0.topic_model_last_updated = (
            topic_model.last_updated)
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for topic_ids '
                'field check of TopicSummaryModel\', '
                '[u"Entity id 0: based on field topic_ids having '
                'value 0, expected model TopicModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated TopicSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_canonical_story_count(self):
        self.model_instance_0.canonical_story_count = 10
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for canonical story '
                'count check of TopicSummaryModel\', '
                '[u"Entity id 0: Canonical story count: 10 does not '
                'match the number of story ids in canonical_story_ids '
                'in topic model: [u\'1\']"]]'
            ), u'[u\'fully-validated TopicSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_additional_story_count(self):
        self.model_instance_0.additional_story_count = 10
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for additional story '
                'count check of TopicSummaryModel\', '
                '[u"Entity id 0: Additional story count: 10 does not '
                'match the number of story ids in '
                'additional_story_ids in topic model: [u\'0\']"]]'
            ), u'[u\'fully-validated TopicSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_uncategorized_skill_count(self):
        self.model_instance_0.uncategorized_skill_count = 10
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for uncategorized skill '
                'count check of TopicSummaryModel\', [u"Entity id 0: '
                'Uncategorized skill count: 10 does not match the '
                'number of skill ids in uncategorized_skill_ids '
                'in topic model: [u\'2\']"]]'
            ), (
                u'[u\'failed validation check for domain object '
                'check of TopicSummaryModel\', [u"Entity id 0: '
                'Entity fails domain validation with the error Expected '
                'total_skill_count to be greater than or equal to '
                'uncategorized_skill_count 10, received \'3\'"]]'
            ), u'[u\'fully-validated TopicSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_total_skill_count(self):
        self.model_instance_0.total_skill_count = 10
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for total skill count '
                'check of TopicSummaryModel\', '
                '[u"Entity id 0: Total skill count: 10 does not match '
                'the total number of skill ids in uncategorized_skill_ids '
                'in topic model: [u\'2\'] and skill_ids in subtopics '
                'of topic model: [u\'0\', u\'1\']"]]'
            ), u'[u\'fully-validated TopicSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_subtopic_count(self):
        self.model_instance_0.subtopic_count = 10
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for subtopic count check of '
                'TopicSummaryModel\', [u"Entity id 0: Subtopic count: 10 '
                'does not match the total number of subtopics in topic model: '
                '[{u\'thumbnail_bg_color\': None, u\'skill_ids\': [u\'0\', '
                'u\'1\'], u\'title\': u\'subtopic1\', u\'url_fragment\': u\'\','
                ' u\'thumbnail_filename\': None, u\'id\': 1}] "]]'
            ), u'[u\'fully-validated TopicSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_topic_related_property(self):
        self.model_instance_0.name = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for name field check of '
                'TopicSummaryModel\', '
                '[u\'Entity id %s: name field in entity: invalid does not '
                'match corresponding topic name field: topic0\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated TopicSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)
