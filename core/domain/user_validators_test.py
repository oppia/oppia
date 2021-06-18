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

"""Unit tests for core.domain.user_validators."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from constants import constants
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import learner_playlist_services
from core.domain import learner_progress_services
from core.domain import prod_validation_jobs_one_off
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import skill_domain
from core.domain import skill_services
from core.domain import state_domain
from core.domain import story_domain
from core.domain import story_services
from core.domain import subscription_services
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_domain
from core.domain import user_query_services
from core.domain import user_services
from core.domain import wipeout_service
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils
import utils

datastore_services = models.Registry.import_datastore_services()

USER_EMAIL = 'useremail@example.com'
USER_NAME = 'username'

(
    collection_models, email_models, exp_models,
    skill_models, story_models, topic_models,
    user_models
) = models.Registry.import_models([
    models.NAMES.collection, models.NAMES.email, models.NAMES.exploration,
    models.NAMES.skill, models.NAMES.story, models.NAMES.topic,
    models.NAMES.user
])


class UserSettingsModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserSettingsModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        # Note: There will a total of 3 UserSettingsModel even though
        # only two users signup in the test since superadmin signup
        # is also done in test_utils.AuditJobsTestBase.
        self.model_instance_0 = user_models.UserSettingsModel.get_by_id(
            self.user_id)
        self.model_instance_1 = user_models.UserSettingsModel.get_by_id(
            self.admin_id)
        self.job_class = (
            prod_validation_jobs_one_off.UserSettingsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserSettingsModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserSettingsModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.user_id, self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated UserSettingsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        user_models.UserSettingsModel.get_by_id(
            self.get_user_id_from_email('tmpsuperadmin@example.com')).delete()
        mock_time = (
            datetime.datetime.utcnow() - datetime.timedelta(days=1))
        self.model_instance_0.last_logged_in = mock_time
        self.model_instance_0.last_agreed_to_terms = mock_time
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserSettingsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_model_with_invalid_schema(self):
        self.model_instance_1.email = 'invalid'
        self.model_instance_1.update_timestamps()
        self.model_instance_1.put()
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'UserSettingsModel\', '
                '[u\'Entity id %s: Entity fails domain validation '
                'with the error Invalid email address: invalid\']]'
            ) % self.admin_id,
            u'[u\'fully-validated UserSettingsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_time_field(self):
        self.model_instance_0.last_created_an_exploration = (
            datetime.datetime.utcnow() + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for last created an exploration '
                'check of UserSettingsModel\', '
                '[u\'Entity id %s: Value for last created an exploration: %s '
                'is greater than the time when job was run\']]'
            ) % (
                self.user_id,
                self.model_instance_0.last_created_an_exploration),
            u'[u\'fully-validated UserSettingsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_first_contribution_msec(self):
        self.model_instance_0.first_contribution_msec = (
            utils.get_current_time_in_millisecs() * 10)
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for first contribution '
                'check of UserSettingsModel\', '
                '[u\'Entity id %s: Value for first contribution msec: %s '
                'is greater than the time when job was run\']]'
            ) % (
                self.user_id,
                self.model_instance_0.first_contribution_msec),
            u'[u\'fully-validated UserSettingsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_non_learner_role_for_profile_user_raise_error(self):
        user_settings_model = user_models.UserSettingsModel.get_by_id(
            self.user_id)
        user_settings_model.pin = '12346'

        user_settings_model.update_timestamps()
        user_settings_model.put()

        user_auth_id = self.get_auth_id_from_email(USER_EMAIL)
        profile_user_data_dict = {
            'schema_version': 1,
            'display_alias': 'display_alias3',
            'pin': '12345',
            'preferred_language_codes': [constants.DEFAULT_LANGUAGE_CODE],
            'preferred_site_language_code': None,
            'preferred_audio_language_code': None,
            'user_id': None,
        }
        modifiable_user_data = user_domain.ModifiableUserData.from_raw_dict(
            profile_user_data_dict)
        profile_user_id = user_services.create_new_profiles(
            user_auth_id, USER_EMAIL, [modifiable_user_data])[0].user_id

        profile_user_settings_model = user_models.UserSettingsModel.get_by_id(
            profile_user_id)
        self.assertEqual(
            profile_user_settings_model.role, feconf.ROLE_ID_LEARNER)

        profile_user_settings_model.role = feconf.ROLE_ID_MODERATOR

        profile_user_settings_model.update_timestamps()
        profile_user_settings_model.put()

        expected_output = [
            (
                u'[u\'failed validation check for profile user role check '
                'of UserSettingsModel\', '
                '[u\'Entity id %s: A profile user should have learner role, '
                'found %s\']]'
            ) % (
                profile_user_settings_model.id, feconf.ROLE_ID_MODERATOR),
            u'[u\'fully-validated UserSettingsModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class UserNormalizedNameAuditOneOffJobTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserNormalizedNameAuditOneOffJobTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        # Note: There will a total of 3 UserSettingsModel even though
        # only two users signup in the test since superadmin signup
        # is also done in test_utils.AuditJobsTestBase.
        self.model_instance_0 = user_models.UserSettingsModel.get_by_id(
            self.user_id)
        self.model_instance_1 = user_models.UserSettingsModel.get_by_id(
            self.admin_id)
        self.job_class = (
            prod_validation_jobs_one_off.UserNormalizedNameAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = []
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_repeated_normalized_username(self):
        self.model_instance_1.normalized_username = USER_NAME
        self.model_instance_1.update_timestamps()
        self.model_instance_1.put()
        sorted_user_ids = sorted([self.user_id, self.admin_id])
        expected_output = [(
            u'[u\'failed validation check for normalized username '
            'check of UserSettingsModel\', '
            'u"Users with ids [\'%s\', \'%s\'] have the same normalized '
            'username username"]') % (
                sorted_user_ids[0], sorted_user_ids[1])]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)

    def test_normalized_username_not_set(self):
        self.model_instance_0.normalized_username = None
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        self.model_instance_1.normalized_username = None
        self.model_instance_1.update_timestamps()
        self.model_instance_1.put()

        expected_output = []
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)


class CompletedActivitiesModelValidatorTests(test_utils.AuditJobsTestBase):

    STORY_ID_0 = 'story_0'
    TOPIC_ID_0 = 'topic_0'
    STORY_ID_1 = 'story_1'
    TOPIC_ID_1 = 'topic_1'

    def setUp(self):
        super(CompletedActivitiesModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_admins([self.ADMIN_USERNAME])
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(3)]

        exploration = explorations[0]
        exploration.add_states(['End'])
        intro_state = exploration.states['Introduction']
        end_state = exploration.states['End']

        self.set_interaction_for_state(intro_state, 'TextInput')
        self.set_interaction_for_state(end_state, 'EndExploration')

        default_outcome = state_domain.Outcome(
            'End', state_domain.SubtitledHtml(
                'default_outcome', '<p>Introduction</p>'),
            False, [], None, None
        )
        intro_state.update_interaction_default_outcome(default_outcome)
        end_state.update_interaction_default_outcome(None)

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)
            rights_manager.publish_exploration(self.owner, exp.id)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(3, 6)]

        for col in collections:
            collection_services.save_new_collection(self.owner_id, col)
            rights_manager.publish_collection(self.owner, col.id)

        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID_0, 'topic', 'abbrev', 'description')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
                'dummy-subtopic-url')]
        topic.next_subtopic_id = 2
        subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                1, self.TOPIC_ID_0))
        subtopic_page_services.save_subtopic_page(
            self.owner_id, subtopic_page, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': 1,
                'title': 'Sample'
            })]
        )
        topic_services.save_new_topic(self.owner_id, topic)
        self.save_new_story(self.STORY_ID_0, self.owner_id, self.TOPIC_ID_0)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_0, self.STORY_ID_0)

        topic_services.publish_story(
            self.TOPIC_ID_0, self.STORY_ID_0, self.admin_id)
        topic_services.publish_topic(self.TOPIC_ID_0, self.admin_id)

        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID_1, 'topic 1', 'abbrev-one', 'description 1')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title 1', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
                'dummy-subtopic-url-one')]
        topic.next_subtopic_id = 2
        subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                1, self.TOPIC_ID_1))
        subtopic_page_services.save_subtopic_page(
            self.owner_id, subtopic_page, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': 1,
                'title': 'Sample'
            })]
        )
        topic_services.save_new_topic(self.owner_id, topic)
        self.save_new_story(self.STORY_ID_1, self.owner_id, self.TOPIC_ID_1)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_1, self.STORY_ID_1)

        topic_services.publish_story(
            self.TOPIC_ID_1, self.STORY_ID_1, self.admin_id)
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, '0', 'Introduction', 1)
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, '3')
        learner_progress_services.record_story_started(
            self.user_id, self.STORY_ID_0)
        learner_progress_services.record_topic_started(
            self.user_id, self.TOPIC_ID_0)
        for i in python_utils.RANGE(1, 3):
            learner_progress_services.mark_exploration_as_completed(
                self.user_id, '%s' % i)
            learner_progress_services.mark_collection_as_completed(
                self.user_id, '%s' % (i + 3))
        learner_progress_services.mark_story_as_completed(
            self.user_id, self.STORY_ID_1)
        learner_progress_services.mark_topic_as_learnt(
            self.user_id, self.TOPIC_ID_1)

        self.model_instance = user_models.CompletedActivitiesModel.get_by_id(
            self.user_id)
        self.job_class = (
            prod_validation_jobs_one_off
            .CompletedActivitiesModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated CompletedActivitiesModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of CompletedActivitiesModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.user_id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CompletedActivitiesModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of CompletedActivitiesModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('2').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        exp_models.ExplorationRightsModel.get_by_id('2').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids '
                'field check of CompletedActivitiesModel\', '
                '[u"Entity id %s: based on field exploration_ids having value '
                '2, expected model ExplorationModel with id 2 but it '
                'doesn\'t exist"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionModel.get_by_id('4').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        collection_models.CollectionRightsModel.get_by_id('4').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_ids '
                'field check of CompletedActivitiesModel\', '
                '[u"Entity id %s: based on field collection_ids having value '
                '4, expected model CollectionModel with id 4 but it '
                'doesn\'t exist"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_story_model_failure(self):
        story_models.StoryModel.get_by_id(self.STORY_ID_1).delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for story_ids '
                'field check of CompletedActivitiesModel\', '
                '[u"Entity id %s: based on field story_ids having value '
                'story_1, expected model StoryModel with id story_1 but it '
                'doesn\'t exist"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_topic_model_failure(self):
        topic_models.TopicModel.get_by_id(self.TOPIC_ID_1).delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for learnt_topic_ids '
                'field check of CompletedActivitiesModel\', '
                '[u"Entity id %s: based on field learnt_topic_ids having value '
                'topic_1, expected model TopicModel with id topic_1 but it '
                'doesn\'t exist"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_common_exploration(self):
        self.model_instance.exploration_ids.append('0')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for exploration_ids match '
            'check of CompletedActivitiesModel\', '
            '[u"Entity id %s: Common values for exploration_ids in entity '
            'and exploration_ids in IncompleteActivitiesModel: [u\'0\']"]]') % (
                self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_common_collection(self):
        self.model_instance.collection_ids.append('3')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for collection_ids match '
            'check of CompletedActivitiesModel\', '
            '[u"Entity id %s: Common values for collection_ids in entity '
            'and collection_ids in IncompleteActivitiesModel: [u\'3\']"]]') % (
                self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_common_story(self):
        self.model_instance.story_ids.append(self.STORY_ID_0)
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for story_ids match '
            'check of CompletedActivitiesModel\', '
            '[u"Entity id %s: Common values for story_ids in entity '
            'and story_ids in IncompleteActivitiesModel: [u\'story_0\']"]]') % (
                self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_common_topic(self):
        self.model_instance.learnt_topic_ids.append(self.TOPIC_ID_0)
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for learnt_topic_ids match '
            'check of CompletedActivitiesModel\', '
            '[u"Entity id %s: Common values for learnt_topic_ids in entity '
            'and partially_learnt_topic_ids in IncompleteActivitiesModel: '
            '[u\'topic_0\']"]]') % (
                self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_private_exploration(self):
        exp = exp_domain.Exploration.create_default_exploration(
            'exp', title='title', category='category')
        exp_services.save_new_exploration(self.owner_id, exp)
        self.model_instance.exploration_ids.append('exp')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for public exploration check '
                'of CompletedActivitiesModel\', '
                '[u"Entity id %s: Explorations with ids [\'exp\'] are '
                'private"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_private_collection(self):
        col = collection_domain.Collection.create_default_collection(
            'col', title='title', category='category')
        collection_services.save_new_collection(self.owner_id, col)
        self.model_instance.collection_ids.append('col')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for public collection check '
                'of CompletedActivitiesModel\', '
                '[u"Entity id %s: Collections with ids [\'col\'] are '
                'private"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class IncompleteActivitiesModelValidatorTests(test_utils.AuditJobsTestBase):

    STORY_ID_0 = 'story_0'
    TOPIC_ID_0 = 'topic_0'
    STORY_ID_1 = 'story_1'
    TOPIC_ID_1 = 'topic_1'

    def setUp(self):
        super(IncompleteActivitiesModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_admins([self.ADMIN_USERNAME])
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(3)]

        for i in python_utils.RANGE(1, 3):
            exploration = explorations[i]
            exploration.add_states(['End'])
            intro_state = exploration.states['Introduction']
            end_state = exploration.states['End']

            self.set_interaction_for_state(intro_state, 'TextInput')
            self.set_interaction_for_state(end_state, 'EndExploration')

            default_outcome = state_domain.Outcome(
                'End', state_domain.SubtitledHtml(
                    'default_outcome', '<p>Introduction</p>'),
                False, [], None, None
            )
            intro_state.update_interaction_default_outcome(default_outcome)
            end_state.update_interaction_default_outcome(None)

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)
            rights_manager.publish_exploration(self.owner, exp.id)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(3, 6)]

        for col in collections:
            collection_services.save_new_collection(self.owner_id, col)
            rights_manager.publish_collection(self.owner, col.id)

        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID_0, 'topic', 'abbrev', 'description')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
                'dummy-subtopic-url')]
        topic.next_subtopic_id = 2
        subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                1, self.TOPIC_ID_0))
        subtopic_page_services.save_subtopic_page(
            self.owner_id, subtopic_page, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': 1,
                'title': 'Sample'
            })]
        )
        topic_services.save_new_topic(self.owner_id, topic)
        self.save_new_story(self.STORY_ID_0, self.owner_id, self.TOPIC_ID_0)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_0, self.STORY_ID_0)

        topic_services.publish_story(
            self.TOPIC_ID_0, self.STORY_ID_0, self.admin_id)
        topic_services.publish_topic(self.TOPIC_ID_0, self.admin_id)

        topic = topic_domain.Topic.create_default_topic(
            self.TOPIC_ID_1, 'topic 1', 'abbrev-one', 'description 1')
        topic.thumbnail_filename = 'thumbnail.svg'
        topic.thumbnail_bg_color = '#C6DCDA'
        topic.subtopics = [
            topic_domain.Subtopic(
                1, 'Title 1', ['skill_id_1'], 'image.svg',
                constants.ALLOWED_THUMBNAIL_BG_COLORS['subtopic'][0],
                'dummy-subtopic-url-one')]
        topic.next_subtopic_id = 2
        subtopic_page = (
            subtopic_page_domain.SubtopicPage.create_default_subtopic_page(
                1, self.TOPIC_ID_1))
        subtopic_page_services.save_subtopic_page(
            self.owner_id, subtopic_page, 'Added subtopic',
            [topic_domain.TopicChange({
                'cmd': topic_domain.CMD_ADD_SUBTOPIC,
                'subtopic_id': 1,
                'title': 'Sample'
            })]
        )
        topic_services.save_new_topic(self.owner_id, topic)
        self.save_new_story(self.STORY_ID_1, self.owner_id, self.TOPIC_ID_1)
        topic_services.add_canonical_story(
            self.owner_id, self.TOPIC_ID_1, self.STORY_ID_1)

        topic_services.publish_story(
            self.TOPIC_ID_1, self.STORY_ID_1, self.admin_id)
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        learner_progress_services.mark_story_as_completed(
            self.user_id, self.STORY_ID_0)
        learner_progress_services.mark_topic_as_learnt(
            self.user_id, self.TOPIC_ID_0)
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, '0')
        learner_progress_services.mark_collection_as_completed(
            self.user_id, '3')
        for i in python_utils.RANGE(1, 3):
            learner_progress_services.mark_exploration_as_incomplete(
                self.user_id, '%s' % i, 'Introduction', 1)
            learner_progress_services.mark_collection_as_incomplete(
                self.user_id, '%s' % (i + 3))
        learner_progress_services.record_story_started(
            self.user_id, self.STORY_ID_1)
        learner_progress_services.record_topic_started(
            self.user_id, self.TOPIC_ID_1)

        self.model_instance = user_models.IncompleteActivitiesModel.get_by_id(
            self.user_id)
        self.job_class = (
            prod_validation_jobs_one_off
            .IncompleteActivitiesModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated IncompleteActivitiesModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of IncompleteActivitiesModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.user_id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'IncompleteActivitiesModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of IncompleteActivitiesModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('2').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        exp_models.ExplorationRightsModel.get_by_id('2').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids '
                'field check of IncompleteActivitiesModel\', '
                '[u"Entity id %s: based on field exploration_ids having value '
                '2, expected model ExplorationModel with id 2 but it '
                'doesn\'t exist"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionModel.get_by_id('4').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        collection_models.CollectionRightsModel.get_by_id('4').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_ids '
                'field check of IncompleteActivitiesModel\', '
                '[u"Entity id %s: based on field collection_ids having value '
                '4, expected model CollectionModel with id 4 but it '
                'doesn\'t exist"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_story_model_failure(self):
        story_models.StoryModel.get_by_id(self.STORY_ID_1).delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for story_ids '
                'field check of IncompleteActivitiesModel\', '
                '[u"Entity id %s: based on field story_ids having value '
                'story_1, expected model StoryModel with id story_1 but it '
                'doesn\'t exist"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_topic_model_failure(self):
        topic_models.TopicModel.get_by_id(self.TOPIC_ID_1).delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for partially_learnt_topic_ids '
                'field check of IncompleteActivitiesModel\', '
                '[u"Entity id %s: based on field partially_learnt_topic_ids '
                'having value topic_1, expected model TopicModel with id '
                'topic_1 but it doesn\'t exist"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_common_exploration(self):
        self.model_instance.exploration_ids.append('0')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for exploration_ids match '
            'check of IncompleteActivitiesModel\', '
            '[u"Entity id %s: Common values for exploration_ids in entity '
            'and exploration_ids in CompletedActivitiesModel: [u\'0\']"]]') % (
                self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_common_collection(self):
        self.model_instance.collection_ids.append('3')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for collection_ids match '
            'check of IncompleteActivitiesModel\', '
            '[u"Entity id %s: Common values for collection_ids in entity '
            'and collection_ids in CompletedActivitiesModel: [u\'3\']"]]') % (
                self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_common_story(self):
        self.model_instance.story_ids.append(self.STORY_ID_0)
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for story_ids match '
            'check of IncompleteActivitiesModel\', '
            '[u"Entity id %s: Common values for story_ids in entity '
            'and story_ids in CompletedActivitiesModel: [u\'story_0\']"]]') % (
                self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_common_topic(self):
        self.model_instance.partially_learnt_topic_ids.append(self.TOPIC_ID_0)
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for partially_learnt_topic_ids match '
            'check of IncompleteActivitiesModel\', '
            '[u"Entity id %s: Common values for partially_learnt_topic_ids in '
            'entity and learnt_topic_ids in CompletedActivitiesModel: '
            '[u\'topic_0\']"]]') % (
                self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_private_exploration(self):
        exp = exp_domain.Exploration.create_default_exploration(
            'exp', title='title', category='category')
        exp_services.save_new_exploration(self.owner_id, exp)
        self.model_instance.exploration_ids.append('exp')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for public exploration check '
                'of IncompleteActivitiesModel\', '
                '[u"Entity id %s: Explorations with ids [\'exp\'] are '
                'private"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_private_collection(self):
        col = collection_domain.Collection.create_default_collection(
            'col', title='title', category='category')
        collection_services.save_new_collection(self.owner_id, col)
        self.model_instance.collection_ids.append('col')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for public collection check '
                'of IncompleteActivitiesModel\', '
                '[u"Entity id %s: Collections with ids [\'col\'] are '
                'private"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class ExpUserLastPlaythroughModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(ExpUserLastPlaythroughModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_admins([self.OWNER_USERNAME])
        self.owner = user_services.get_user_actions_info(self.owner_id)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(2)]

        exploration = explorations[0]
        exploration.add_states(['End'])
        intro_state = exploration.states['Introduction']
        end_state = exploration.states['End']

        self.set_interaction_for_state(intro_state, 'TextInput')
        self.set_interaction_for_state(end_state, 'EndExploration')

        default_outcome = state_domain.Outcome(
            'End', state_domain.SubtitledHtml(
                'default_outcome', '<p>Introduction</p>'),
            False, [], None, None
        )
        intro_state.update_interaction_default_outcome(default_outcome)
        end_state.update_interaction_default_outcome(None)

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)
            rights_manager.publish_exploration(self.owner, exp.id)

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        learner_progress_services.mark_exploration_as_completed(
            self.user_id, '1')
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, '0', 'Introduction', 1)

        self.model_instance = (
            user_models.ExpUserLastPlaythroughModel.get_by_id(
                '%s.0' % self.user_id))
        self.job_class = (
            prod_validation_jobs_one_off
            .ExpUserLastPlaythroughModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated ExpUserLastPlaythroughModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of ExpUserLastPlaythroughModel\', '
            '[u\'Entity id %s.0: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.user_id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExpUserLastPlaythroughModel\', '
            '[u\'Entity id %s.0: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of ExpUserLastPlaythroughModel\', '
                '[u"Entity id %s.0: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        exp_models.ExplorationRightsModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids '
                'field check of ExpUserLastPlaythroughModel\', '
                '[u"Entity id %s.0: based on field exploration_ids having '
                'value 0, expected model ExplorationModel with id 0 but it '
                'doesn\'t exist"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_complete_exploration_in_exploration_id(self):
        self.model_instance.exploration_id = '1'
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for incomplete exp id '
                'check of ExpUserLastPlaythroughModel\', [u\'Entity id %s.0: '
                'Exploration id 1 for entity is not marked as incomplete\']]'
            ) % self.user_id, (
                u'[u\'failed validation check for model id check of '
                'ExpUserLastPlaythroughModel\', [u\'Entity id %s.0: Entity id '
                'does not match regex pattern\']]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_private_exploration(self):
        exp_rights_model = exp_models.ExplorationRightsModel.get('0')
        exp_rights_model.status = constants.ACTIVITY_STATUS_PRIVATE
        exp_rights_model.update_timestamps()
        exp_rights_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Make exploration private',
            [{'cmd': rights_domain.CMD_CHANGE_EXPLORATION_STATUS}])
        expected_output = [
            (
                u'[u\'failed validation check for public exploration check '
                'of ExpUserLastPlaythroughModel\', '
                '[u"Entity id %s.0: Explorations with ids [\'0\'] are '
                'private"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_version(self):
        self.model_instance.last_played_exp_version = 10
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for version check '
                'of ExpUserLastPlaythroughModel\', '
                '[u\'Entity id %s.0: last played exp version 10 is greater '
                'than current version 1 of exploration with id 0\']]') % (
                    self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_state_name(self):
        self.model_instance.last_played_state_name = 'invalidθ'
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for state name check '
                'of ExpUserLastPlaythroughModel\', '
                '[u"Entity id %s.0: last played state name invalid\\u03b8 is '
                'not present in exploration states [u\'Introduction\', '
                'u\'End\'] for exploration id 0"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class LearnerPlaylistModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(LearnerPlaylistModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(4)]

        exploration = explorations[1]
        exploration.add_states(['End'])
        intro_state = exploration.states['Introduction']
        end_state = exploration.states['End']

        self.set_interaction_for_state(intro_state, 'TextInput')
        self.set_interaction_for_state(end_state, 'EndExploration')

        default_outcome = state_domain.Outcome(
            'End', state_domain.SubtitledHtml(
                'default_outcome', '<p>Introduction</p>'),
            False, [], None, None
        )
        intro_state.update_interaction_default_outcome(default_outcome)
        end_state.update_interaction_default_outcome(None)

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)
            rights_manager.publish_exploration(self.owner, exp.id)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(4, 8)]

        for col in collections:
            collection_services.save_new_collection(self.owner_id, col)
            rights_manager.publish_collection(self.owner, col.id)

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        learner_progress_services.mark_exploration_as_completed(
            self.user_id, '0')
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, '1', 'Introduction', 1)
        learner_progress_services.mark_collection_as_completed(
            self.user_id, '4')
        learner_progress_services.mark_collection_as_incomplete(
            self.user_id, '5')

        for i in python_utils.RANGE(2, 4):
            learner_playlist_services.mark_exploration_to_be_played_later(
                self.user_id, '%s' % i)
            learner_playlist_services.mark_collection_to_be_played_later(
                self.user_id, '%s' % (i + 4))

        self.model_instance = user_models.LearnerPlaylistModel.get_by_id(
            self.user_id)
        self.job_class = (
            prod_validation_jobs_one_off.LearnerPlaylistModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated LearnerPlaylistModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of LearnerPlaylistModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.user_id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'LearnerPlaylistModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of LearnerPlaylistModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('2').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        exp_models.ExplorationRightsModel.get_by_id('2').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids '
                'field check of LearnerPlaylistModel\', '
                '[u"Entity id %s: based on field exploration_ids having value '
                '2, expected model ExplorationModel with id 2 but it '
                'doesn\'t exist"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionModel.get_by_id('6').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        collection_models.CollectionRightsModel.get_by_id('6').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_ids '
                'field check of LearnerPlaylistModel\', '
                '[u"Entity id %s: based on field collection_ids having value '
                '6, expected model CollectionModel with id 6 but it '
                'doesn\'t exist"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_common_completed_exploration(self):
        self.model_instance.exploration_ids.append('0')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for exploration_ids match '
            'check of LearnerPlaylistModel\', '
            '[u"Entity id %s: Common values for exploration_ids in entity '
            'and exploration_ids in CompletedActivitiesModel: [u\'0\']"]]') % (
                self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_common_incomplete_exploration(self):
        self.model_instance.exploration_ids.append('1')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for exploration_ids match '
            'check of LearnerPlaylistModel\', '
            '[u"Entity id %s: Common values for exploration_ids in entity '
            'and exploration_ids in IncompleteActivitiesModel: [u\'1\']"]]') % (
                self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_common_completed_collection(self):
        self.model_instance.collection_ids.append('4')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for collection_ids match '
            'check of LearnerPlaylistModel\', '
            '[u"Entity id %s: Common values for collection_ids in entity '
            'and collection_ids in CompletedActivitiesModel: [u\'4\']"]]') % (
                self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_common_incomplete_collection(self):
        self.model_instance.collection_ids.append('5')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for collection_ids match '
            'check of LearnerPlaylistModel\', '
            '[u"Entity id %s: Common values for collection_ids in entity '
            'and collection_ids in IncompleteActivitiesModel: [u\'5\']"]]') % (
                self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_private_exploration(self):
        exp = exp_domain.Exploration.create_default_exploration(
            'exp', title='title', category='category')
        exp_services.save_new_exploration(self.owner_id, exp)
        self.model_instance.exploration_ids.append('exp')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for public exploration check '
                'of LearnerPlaylistModel\', '
                '[u"Entity id %s: Explorations with ids [\'exp\'] are '
                'private"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_private_collection(self):
        col = collection_domain.Collection.create_default_collection(
            'col', title='title', category='category')
        collection_services.save_new_collection(self.owner_id, col)
        self.model_instance.collection_ids.append('col')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for public collection check '
                'of LearnerPlaylistModel\', '
                '[u"Entity id %s: Collections with ids [\'col\'] are '
                'private"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class UserContributionsModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserContributionsModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.user = user_services.get_user_actions_info(self.user_id)

        self.save_new_valid_exploration(
            'exp0', self.owner_id, end_state_name='End')
        self.save_new_valid_exploration(
            'exp1', self.owner_id, end_state_name='End')
        exp_services.update_exploration(
            self.user_id, 'exp0', [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'the objective'
            })], 'Test edit')
        exp_services.update_exploration(
            self.owner_id, 'exp0', [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'The objective'
            })], 'Test edit 2')
        self.process_and_flush_pending_tasks()

        rights_manager.publish_exploration(self.owner, 'exp0')
        rights_manager.publish_exploration(self.owner, 'exp1')

        # We will have three UserContributionsModel here since a model
        # since this model is created when UserSettingsModel is created
        # and we have also signed up super admin user in test_utils.
        self.model_instance_0 = user_models.UserContributionsModel.get_by_id(
            self.owner_id)
        self.model_instance_1 = user_models.UserContributionsModel.get_by_id(
            self.user_id)
        self.job_class = (
            prod_validation_jobs_one_off.UserContributionsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserContributionsModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserContributionsModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.owner_id, self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated UserContributionsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        user_models.UserContributionsModel.get_by_id(
            self.get_user_id_from_email('tmpsuperadmin@example.com')).delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserContributionsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.owner_id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserContributionsModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id),
            u'[u\'fully-validated UserContributionsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_created_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('exp1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for created_exploration_ids '
                'field check of UserContributionsModel\', '
                '[u"Entity id %s: based on field created_exploration_ids '
                'having value exp1, expected model ExplorationModel with id '
                'exp1 but it doesn\'t exist"]]' % self.owner_id
            ), (
                u'[u\'failed validation check for edited_exploration_ids '
                'field check of UserContributionsModel\', '
                '[u"Entity id %s: based on field edited_exploration_ids '
                'having value exp1, expected model ExplorationModel with '
                'id exp1 but it doesn\'t exist"]]' % self.owner_id
            ), u'[u\'fully-validated UserContributionsModel\', 2]']

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_edited_exploration_model_failure(self):
        self.model_instance_0.delete()
        exp_models.ExplorationModel.get_by_id('exp0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for edited_exploration_ids '
                'field check of UserContributionsModel\', '
                '[u"Entity id %s: based on field edited_exploration_ids '
                'having value exp0, expected model ExplorationModel with '
                'id exp0 but it doesn\'t exist"]]' % self.user_id
            ), u'[u\'fully-validated UserContributionsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class UserEmailPreferencesModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserEmailPreferencesModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        user_services.update_email_preferences(
            self.user_id, True, True, False, True)

        self.model_instance = user_models.UserEmailPreferencesModel.get_by_id(
            self.user_id)
        self.job_class = (
            prod_validation_jobs_one_off
            .UserEmailPreferencesModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserEmailPreferencesModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserEmailPreferencesModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.user_id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserEmailPreferencesModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserEmailPreferencesModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class UserSubscriptionsModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserSubscriptionsModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(3)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)
            rights_manager.publish_exploration(self.owner, exp.id)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(3, 6)]

        for collection in collections:
            collection_services.save_new_collection(self.owner_id, collection)
            rights_manager.publish_collection(self.owner, collection.id)

        thread_id = feedback_services.create_thread(
            'exploration', 'exp_id', None, 'a subject', 'some text')

        subscription_services.subscribe_to_thread(
            self.user_id, thread_id)
        subscription_services.subscribe_to_creator(self.user_id, self.owner_id)
        for exp in explorations:
            subscription_services.subscribe_to_exploration(
                self.user_id, exp.id)
        for collection in collections:
            subscription_services.subscribe_to_collection(
                self.user_id, collection.id)
        self.process_and_flush_pending_mapreduce_tasks()

        self.model_instance = user_models.UserSubscriptionsModel.get_by_id(
            self.user_id)
        self.job_class = (
            prod_validation_jobs_one_off.UserSubscriptionsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserSubscriptionsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserSubscriptionsModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.user_id, self.model_instance.created_on,
                self.model_instance.last_updated
            ), u'[u\'fully-validated UserSubscriptionsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        user_models.UserSubscriptionsModel.get_by_id(self.owner_id).delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserSubscriptionsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_invalid_last_checked(self):
        self.model_instance.last_checked = (
            datetime.datetime.utcnow() + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for last checked check of '
                'UserSubscriptionsModel\', '
                '[u\'Entity id %s: last checked %s is greater than the time '
                'when job was run\']]' % (
                    self.user_id, self.model_instance.last_checked)
            ), u'[u\'fully-validated UserSubscriptionsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_user_id_in_subscriber_ids(self):
        subscriber_model = user_models.UserSubscribersModel.get_by_id(
            self.owner_id)
        subscriber_model.subscriber_ids.remove(self.user_id)
        subscriber_model.update_timestamps()
        subscriber_model.put()
        expected_output = [
            (
                u'[u\'failed validation check for subscriber id check '
                'of UserSubscriptionsModel\', [u\'Entity id %s: '
                'User id is not present in subscriber ids of creator '
                'with id %s to whom the user has subscribed\']]' % (
                    self.user_id, self.owner_id)
            ), u'[u\'fully-validated UserSubscriptionsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_subscriber_model_failure(self):
        user_models.UserSubscribersModel.get_by_id(self.owner_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for subscriber_ids '
                'field check of UserSubscriptionsModel\', '
                '[u"Entity id %s: based on '
                'field subscriber_ids having value '
                '%s, expected model UserSubscribersModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.owner_id, self.owner_id),
            u'[u\'fully-validated UserSubscriptionsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_get_external_id_relationship_failure(self):
        nonexist_thread_id = 'nonexist_thread_id'
        subscription_services.subscribe_to_thread(
            self.user_id, nonexist_thread_id)

        expected_output = [
            (
                u'[u\'failed validation check for general_feedback_thread_ids '
                'field check of UserSubscriptionsModel\', '
                '[u"Entity id %s: based on '
                'field general_feedback_thread_ids having value '
                'nonexist_thread_id, expected model GeneralFeedbackThreadModel '
                'with id nonexist_thread_id but it doesn\'t '
                'exist"]]') % self.user_id,
            u'[u\'fully-validated UserSubscriptionsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class UserSubscribersModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserSubscribersModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        subscription_services.subscribe_to_creator(self.user_id, self.owner_id)
        subscription_services.subscribe_to_creator(
            self.admin_id, self.owner_id)

        self.model_instance = user_models.UserSubscribersModel.get_by_id(
            self.owner_id)
        self.job_class = (
            prod_validation_jobs_one_off.UserSubscribersModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserSubscribersModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserSubscribersModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.owner_id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserSubscribersModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.owner_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_user_id_in_subscriber_ids(self):
        self.model_instance.subscriber_ids.append(self.owner_id)
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for subscriber id check '
                'of UserSubscribersModel\', [u\'Entity id %s: User id is '
                'present in subscriber ids for user\']]' % self.owner_id
            ), (
                u'[u\'failed validation check for subscription_ids field '
                'check of UserSubscribersModel\', [u"Entity id %s: '
                'based on field subscription_ids having value %s, expected '
                'model UserSubscriptionsModel with id %s but it doesn\'t '
                'exist"]]'
            ) % (self.owner_id, self.owner_id, self.owner_id)]

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_user_id_in_creator_ids(self):
        subscription_model = user_models.UserSubscriptionsModel.get_by_id(
            self.user_id)
        subscription_model.creator_ids.remove(self.owner_id)
        subscription_model.update_timestamps()
        subscription_model.put()
        expected_output = [(
            u'[u\'failed validation check for subscription creator id '
            'check of UserSubscribersModel\', [u\'Entity id %s: User id '
            'is not present in creator ids to which the subscriber of user '
            'with id %s has subscribed\']]') % (self.owner_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.owner_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserSubscribersModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.owner_id, self.owner_id, self.owner_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_user_subscriptions_model_failure(self):
        user_models.UserSubscriptionsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for subscription_ids '
                'field check of UserSubscribersModel\', '
                '[u"Entity id %s: based on '
                'field subscription_ids having value '
                '%s, expected model UserSubscriptionsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.owner_id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class UserRecentChangesBatchModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserRecentChangesBatchModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        self.model_instance = user_models.UserRecentChangesBatchModel(
            id=self.user_id, job_queued_msec=10)
        self.model_instance.update_timestamps()
        self.model_instance.put()
        self.job_class = (
            prod_validation_jobs_one_off
            .UserRecentChangesBatchModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserRecentChangesBatchModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserRecentChangesBatchModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.user_id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserRecentChangesBatchModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_invalid_job_queued_msec(self):
        self.model_instance.job_queued_msec = (
            utils.get_current_time_in_millisecs() * 10)
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for job queued msec check of '
            'UserRecentChangesBatchModel\', '
            '[u\'Entity id %s: job queued msec %s is greater than the time '
            'when job was run\']]'
        ) % (self.user_id, self.model_instance.job_queued_msec)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserRecentChangesBatchModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class UserStatsModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserStatsModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        self.datetime_key = datetime.datetime.utcnow().strftime(
            feconf.DASHBOARD_STATS_DATETIME_STRING_FORMAT)
        weekly_creator_stats_list = [{
            self.datetime_key: {
                'num_ratings': 5,
                'average_ratings': 4,
                'total_plays': 5
            }
        }]
        self.model_instance = user_models.UserStatsModel(
            id=self.user_id, impact_score=10, total_plays=5, average_ratings=4,
            weekly_creator_stats_list=weekly_creator_stats_list)
        self.model_instance.update_timestamps()
        self.model_instance.put()
        self.job_class = (
            prod_validation_jobs_one_off.UserStatsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserStatsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserStatsModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.user_id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        time_str = (
            datetime.datetime.utcnow() - datetime.timedelta(days=1)).strftime(
                feconf.DASHBOARD_STATS_DATETIME_STRING_FORMAT)
        self.model_instance.weekly_creator_stats_list = [{
            time_str: {
                'num_ratings': 5,
                'average_ratings': 4,
                'total_plays': 5
            }
        }]
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserStatsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_invalid_schema_version(self):
        self.model_instance.schema_version = (
            feconf.CURRENT_DASHBOARD_STATS_SCHEMA_VERSION + 10)
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for schema version check of '
            'UserStatsModel\', '
            '[u\'Entity id %s: schema version %s is greater than current '
            'version %s\']]'
        ) % (
            self.user_id, self.model_instance.schema_version,
            feconf.CURRENT_DASHBOARD_STATS_SCHEMA_VERSION)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_key_type_in_stats(self):
        self.model_instance.weekly_creator_stats_list = [{
            'invalid': {
                'num_ratings': 5,
                'average_ratings': 4,
                'total_plays': 5
            }
        }]
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for weekly creator stats list '
            'of UserStatsModel\', [u"Entity id %s: Invalid stats dict: '
            '{u\'invalid\': {u\'num_ratings\': 5, u\'average_ratings\': 4, '
            'u\'total_plays\': 5}}"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_key_value_in_stats(self):
        time_str = (
            datetime.datetime.utcnow() + datetime.timedelta(days=1)).strftime(
                feconf.DASHBOARD_STATS_DATETIME_STRING_FORMAT)
        self.model_instance.weekly_creator_stats_list = [{
            time_str: {
                'num_ratings': 5,
                'average_ratings': 4,
                'total_plays': 5
            }
        }]
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for weekly creator stats '
            'list of UserStatsModel\', [u"Entity id %s: Invalid stats '
            'dict: {u\'%s\': {u\'num_ratings\': 5, '
            'u\'average_ratings\': 4, u\'total_plays\': 5}}"]]') % (
                self.user_id, time_str)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_value_in_stats(self):
        self.model_instance.weekly_creator_stats_list = [{
            self.datetime_key: 'invalid'
        }]
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for weekly creator stats list '
            'of UserStatsModel\', [u"Entity id %s: Invalid stats dict: '
            '{u\'%s\': u\'invalid\'}"]]') % (self.user_id, self.datetime_key)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_properties_in_stats(self):
        self.model_instance.weekly_creator_stats_list = [{
            self.datetime_key: {
                'invalid': 2
            }
        }]
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for weekly creator stats '
            'list of UserStatsModel\', [u"Entity id %s: Invalid stats '
            'dict: {u\'%s\': {u\'invalid\': 2}}"]]') % (
                self.user_id, self.datetime_key)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_property_values_in_stats(self):
        self.model_instance.weekly_creator_stats_list = [{
            self.datetime_key: {
                'num_ratings': 2,
                'average_ratings': 'invalid',
                'total_plays': 4
            }
        }]
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for weekly creator stats '
            'list of UserStatsModel\', [u"Entity id %s: Invalid stats '
            'dict: {u\'%s\': {u\'num_ratings\': 2, '
            'u\'average_ratings\': u\'invalid\', u\'total_plays\': 4}}"]]'
        ) % (self.user_id, self.datetime_key)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserStatsModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.user_id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class ExplorationUserDataModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(ExplorationUserDataModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.user = user_services.get_user_actions_info(self.user_id)

        self.save_new_valid_exploration(
            'exp0', self.user_id, end_state_name='End')

        self.model_instance = user_models.ExplorationUserDataModel.create(
            self.user_id, 'exp0')
        self.model_instance.draft_change_list = [{
            'cmd': 'edit_exploration_property',
            'property_name': 'objective',
            'new_value': 'the objective'
        }]
        self.model_instance.draft_change_list_exp_version = 1
        self.model_instance.draft_change_list_last_updated = (
            datetime.datetime.utcnow())
        self.model_instance.rating = 4
        self.model_instance.rated_on = datetime.datetime.utcnow()
        self.model_instance.update_timestamps()
        self.model_instance.put()
        self.job_class = (
            prod_validation_jobs_one_off.ExplorationUserDataModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated ExplorationUserDataModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of ExplorationUserDataModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        mock_time = datetime.datetime.utcnow() - datetime.timedelta(days=1)
        self.model_instance.draft_change_list_last_updated = mock_time
        self.model_instance.rated_on = mock_time
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ExplorationUserDataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of ExplorationUserDataModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('exp0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids '
                'field check of ExplorationUserDataModel\', '
                '[u"Entity id %s: based on field exploration_ids '
                'having value exp0, expected model ExplorationModel with id '
                'exp0 but it doesn\'t exist"]]' % self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_null_draft_change_list(self):
        self.model_instance.draft_change_list = None
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            u'[u\'fully-validated ExplorationUserDataModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_draft_change_list(self):
        self.model_instance.draft_change_list = [{
            'cmd': 'invalid'
        }]
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for draft change list check '
            'of ExplorationUserDataModel\', [u"Entity id %s: Invalid '
            'change dict {u\'cmd\': u\'invalid\'} due to error '
            'Command invalid is not allowed"]]') % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_exp_version(self):
        self.model_instance.draft_change_list_exp_version = 2
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for exp version check '
            'of ExplorationUserDataModel\', [u\'Entity id %s: '
            'draft change list exp version 2 is greater than '
            'version 1 of corresponding exploration with id exp0\']]') % (
                self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_draft_change_list_last_updated(self):
        self.model_instance.draft_change_list_last_updated = (
            datetime.datetime.utcnow() + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for draft change list last '
            'updated check of ExplorationUserDataModel\', [u\'Entity id %s: '
            'draft change list last updated %s is greater than the '
            'time when job was run\']]') % (
                self.model_instance.id,
                self.model_instance.draft_change_list_last_updated)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_draft_change_list_last_updated_as_none(self):
        self.model_instance.draft_change_list_last_updated = None
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for draft change list last '
            'updated check of ExplorationUserDataModel\', [u"Entity id %s: '
            'draft change list [{u\'new_value\': u\'the objective\', '
            'u\'cmd\': u\'edit_exploration_property\', '
            'u\'property_name\': u\'objective\'}] exists but draft '
            'change list last updated is None"]]') % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_rating(self):
        self.model_instance.rating = -1
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for ratings check of '
            'ExplorationUserDataModel\', [u\'Entity id %s: Expected '
            'rating to be in range [1, 5], received -1\']]') % (
                self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_rated_on(self):
        self.model_instance.rated_on = (
            datetime.datetime.utcnow() + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for rated on check of '
            'ExplorationUserDataModel\', [u\'Entity id %s: rated on '
            '%s is greater than the time when job was run\']]') % (
                self.model_instance.id, self.model_instance.rated_on)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_rated_on_as_none(self):
        self.model_instance.rated_on = None
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for rated on check of '
            'ExplorationUserDataModel\', [u\'Entity id %s: rating 4 '
            'exists but rated on is None\']]') % (self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class CollectionProgressModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(CollectionProgressModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_admins([self.OWNER_USERNAME])
        self.owner = user_services.get_user_actions_info(self.owner_id)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(4)]

        collection = collection_domain.Collection.create_default_collection(
            'col')

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)
            rights_manager.publish_exploration(self.owner, exp.id)
            if exp.id != '3':
                collection.add_node(exp.id)

        collection_services.save_new_collection(self.owner_id, collection)
        rights_manager.publish_collection(self.owner, 'col')

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        learner_progress_services.mark_exploration_as_completed(
            self.user_id, '0')
        collection_services.record_played_exploration_in_collection_context(
            self.user_id, 'col', '0')
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, '1')
        collection_services.record_played_exploration_in_collection_context(
            self.user_id, 'col', '1')
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, '3')

        self.model_instance = user_models.CollectionProgressModel.get_by_id(
            '%s.col' % self.user_id)
        self.job_class = (
            prod_validation_jobs_one_off.CollectionProgressModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated CollectionProgressModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of CollectionProgressModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CollectionProgressModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of CollectionProgressModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        exp_models.ExplorationRightsModel.get_by_id('1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for exploration_ids '
                'field check of CollectionProgressModel\', '
                '[u"Entity id %s: based on field exploration_ids having value '
                '1, expected model ExplorationModel with id 1 but it '
                'doesn\'t exist"]]') % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionModel.get_by_id('col').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        collection_models.CollectionRightsModel.get_by_id('col').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_ids '
                'field check of CollectionProgressModel\', '
                '[u"Entity id %s: based on field collection_ids having value '
                'col, expected model CollectionModel with id col but it '
                'doesn\'t exist"]]') % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_completed_activities_model_failure(self):
        user_models.CompletedActivitiesModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for completed_activities_ids '
                'field check of CollectionProgressModel\', '
                '[u"Entity id %s: based on field completed_activities_ids '
                'having value %s, expected model CompletedActivitiesModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_private_exploration(self):
        exp_rights_model = exp_models.ExplorationRightsModel.get('0')
        exp_rights_model.status = constants.ACTIVITY_STATUS_PRIVATE
        exp_rights_model.update_timestamps()
        exp_rights_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Make exploration private',
            [{'cmd': rights_domain.CMD_CHANGE_EXPLORATION_STATUS}])
        expected_output = [
            (
                u'[u\'failed validation check for public exploration check '
                'of CollectionProgressModel\', '
                '[u"Entity id %s: Explorations with ids [\'0\'] are '
                'private"]]') % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_private_collection(self):
        rights_manager.unpublish_collection(self.owner, 'col')
        expected_output = [
            (
                u'[u\'failed validation check for public collection check '
                'of CollectionProgressModel\', '
                '[u"Entity id %s: Collections with ids [\'col\'] are '
                'private"]]') % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_completed_exploration_missing_in_completed_activities(self):
        self.model_instance.completed_explorations.append('2')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for completed exploration check of '
            'CollectionProgressModel\', [u"Entity id %s: Following completed '
            'exploration ids [u\'2\'] are not present in '
            'CompletedActivitiesModel for the user"]]') % (
                self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_completed_exploration_missing_in_collection(self):
        self.model_instance.completed_explorations.append('3')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for completed exploration check '
            'of CollectionProgressModel\', [u"Entity id %s: Following '
            'completed exploration ids [u\'3\'] do not belong to the '
            'collection with id col corresponding to the entity"]]') % (
                self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class StoryProgressModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(StoryProgressModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_admins([self.OWNER_USERNAME])
        self.owner = user_services.get_user_actions_info(self.owner_id)

        explorations = [self.save_new_valid_exploration(
            '%s' % i,
            self.owner_id,
            title='title %d' % i,
            end_state_name='End State',
            correctness_feedback_enabled=True
        ) for i in python_utils.RANGE(4)]

        for exp in explorations:
            rights_manager.publish_exploration(self.owner, exp.id)

        topic = topic_domain.Topic.create_default_topic(
            '0', 'topic', 'abbrev', 'description')

        story = story_domain.Story.create_default_story(
            'story',
            'title %d',
            'description %d',
            '0',
            'title-z'
        )

        story.add_node('node_1', 'Node1')
        story.add_node('node_2', 'Node2')
        story.add_node('node_3', 'Node3')
        story.update_node_destination_node_ids('node_1', ['node_2'])
        story.update_node_destination_node_ids('node_2', ['node_3'])
        story.update_node_exploration_id('node_1', '1')
        story.update_node_exploration_id('node_2', '2')
        story.update_node_exploration_id('node_3', '3')
        topic.add_canonical_story(story.id)
        story_services.save_new_story(self.owner_id, story)
        topic_services.save_new_topic(self.owner_id, topic)
        topic_services.publish_story(topic.id, story.id, self.owner_id)

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        learner_progress_services.mark_exploration_as_completed(
            self.user_id, '1')
        story_services.record_completed_node_in_story_context(
            self.user_id, 'story', 'node_1')
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, '2')
        story_services.record_completed_node_in_story_context(
            self.user_id, 'story', 'node_2')
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, '0')

        self.model_instance = user_models.StoryProgressModel.get_by_id(
            '%s.story' % self.user_id)
        self.job_class = (
            prod_validation_jobs_one_off.StoryProgressModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated StoryProgressModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of StoryProgressModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'StoryProgressModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of StoryProgressModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_story_model_failure(self):
        story_models.StoryModel.get_by_id('story').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for story_ids '
                'field check of StoryProgressModel\', '
                '[u"Entity id %s: based on field story_ids having value '
                'story, expected model StoryModel with id story but it '
                'doesn\'t exist"]]') % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_private_story(self):
        topic_id = (
            story_models.StoryModel.get_by_id('story').corresponding_topic_id)
        topic_services.unpublish_story(topic_id, 'story', self.owner_id)
        expected_output = [
            (
                u'[u\'failed validation check for public story check '
                'of StoryProgressModel\', '
                '[u\'Entity id %s: Story with id story corresponding '
                'to entity is private\']]') % self.model_instance.id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_completed_node_missing_in_story_node_ids(self):
        self.model_instance.completed_node_ids.append('invalid')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for completed node check of '
            'StoryProgressModel\', [u"Entity id %s: Following completed '
            'node ids [u\'invalid\'] do not belong to the story with '
            'id story corresponding to the entity"]]') % (
                self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_private_exploration(self):
        exp_rights_model = exp_models.ExplorationRightsModel.get('1')
        exp_rights_model.status = constants.ACTIVITY_STATUS_PRIVATE
        exp_rights_model.update_timestamps()
        exp_rights_model.commit(
            feconf.SYSTEM_COMMITTER_ID,
            'Make exploration private',
            [{'cmd': rights_domain.CMD_CHANGE_EXPLORATION_STATUS}])
        expected_output = [(
            u'[u\'failed validation check for explorations in completed '
            'node check of StoryProgressModel\', [u"Entity id %s: '
            'Following exploration ids are private [u\'1\']. "]]') % (
                self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_exploration(self):
        exp_models.ExplorationModel.get_by_id('1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [(
            u'[u\'failed validation check for explorations in completed '
            'node check of StoryProgressModel\', [u"Entity id %s: '
            'Following exploration ids are missing [u\'1\']. "]]') % (
                self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_exploration_not_marked_as_completed(self):
        completed_activities_model = (
            user_models.CompletedActivitiesModel.get_by_id(self.user_id))
        completed_activities_model.exploration_ids.remove('1')
        completed_activities_model.update_timestamps()
        completed_activities_model.put()
        expected_output = [(
            u'[u\'failed validation check for explorations in completed '
            'node check of StoryProgressModel\', [u"Entity id %s: '
            'Following exploration ids are not marked in '
            'CompletedActivitiesModel [u\'1\']."]]') % (
                self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class UserQueryModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserQueryModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        self.user_query_id = user_query_services.save_new_user_query(
            self.admin_id, {
                'inactive_in_last_n_days': 10,
                'created_at_least_n_exps': 5,
                'has_not_logged_in_for_n_days': 30
            })

        self.model_instance = user_models.UserQueryModel.get_by_id(
            self.user_query_id)
        self.model_instance.user_ids = [self.owner_id, self.user_id]
        self.model_instance.update_timestamps()
        self.model_instance.put()

        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            user_query_services.send_email_to_qualified_users(
                self.user_query_id, 'subject', 'body',
                feconf.BULK_EMAIL_INTENT_MARKETING, 5)
        self.model_instance = user_models.UserQueryModel.get_by_id(
            self.user_query_id)
        self.sent_mail_id = self.model_instance.sent_email_model_id

        self.model_instance.query_status = feconf.USER_QUERY_STATUS_COMPLETED
        self.model_instance.deleted = False
        self.model_instance.update_timestamps()
        self.model_instance.put()
        self.job_class = (
            prod_validation_jobs_one_off.UserQueryModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserQueryModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserQueryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.user_query_id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserQueryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_query_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserQueryModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]'
            ) % (self.user_query_id, self.user_id, self.user_id)
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_sent_email_model_failure(self):
        email_models.BulkEmailModel.get_by_id(self.sent_mail_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for sent_email_model_ids '
                'field check of UserQueryModel\', '
                '[u"Entity id %s: based on '
                'field sent_email_model_ids having value '
                '%s, expected model BulkEmailModel '
                'with id %s but it doesn\'t exist"]]'
            ) % (self.user_query_id, self.sent_mail_id, self.sent_mail_id)
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_extra_recipients(self):
        bulk_email_model = email_models.BulkEmailModel.get_by_id(
            self.sent_mail_id)
        bulk_email_model.recipient_ids.append('invalid')
        bulk_email_model.update_timestamps()
        bulk_email_model.put()
        expected_output = [
            (
                u'[u\'failed validation check for recipient check of '
                'UserQueryModel\', [u"Entity id %s: Email model %s '
                'for query has following extra recipients [u\'invalid\'] '
                'which are not qualified as per the query"]]'
            ) % (self.user_query_id, self.sent_mail_id)
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_sender_id(self):
        bulk_email_model = email_models.BulkEmailModel.get_by_id(
            self.sent_mail_id)
        bulk_email_model.sender_id = 'invalid'
        bulk_email_model.update_timestamps()
        bulk_email_model.put()
        expected_output = [
            (
                u'[u\'failed validation check for sender check of '
                'UserQueryModel\', [u\'Entity id %s: Sender id invalid in '
                'email model with id %s does not match submitter id '
                '%s of query\']]'
            ) % (self.user_query_id, self.sent_mail_id, self.admin_id)
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_user_bulk_email_model(self):
        user_models.UserBulkEmailsModel.get_by_id(self.owner_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user bulk email check of '
                'UserQueryModel\', [u\'Entity id %s: UserBulkEmails model '
                'is missing for recipient with id %s\']]'
            ) % (self.user_query_id, self.owner_id)
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_not_marked_as_deleted_when_older_than_4_weeks(self):
        self.model_instance.created_on = (
            self.model_instance.created_on - datetime.timedelta(weeks=5))
        self.model_instance.last_updated = (
            self.model_instance.last_updated - datetime.timedelta(weeks=5))
        self.model_instance.update_timestamps(update_last_updated_time=False)
        self.model_instance.put()
        expected_output = [(
            '[u\'failed validation check for entity stale check of '
            'UserQueryModel\', [u\'Entity id %s: '
            'Model older than 4 weeks\']]') % self.user_query_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_not_marked_as_deleted_when_query_status_set_as_archived(
            self):
        self.model_instance.query_status = feconf.USER_QUERY_STATUS_ARCHIVED
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            '[u\'failed validation check for entity stale check of '
            'UserQueryModel\', [u\'Entity id %s: '
            'Archived model not marked as deleted\']]') % self.user_query_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class UserBulkEmailsModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserBulkEmailsModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        self.user_query_id = user_query_services.save_new_user_query(
            self.admin_id, {
                'inactive_in_last_n_days': 10,
                'created_at_least_n_exps': 5,
                'has_not_logged_in_for_n_days': 30
            })

        query_model = user_models.UserQueryModel.get_by_id(
            self.user_query_id)
        query_model.user_ids = [self.owner_id, self.user_id]
        query_model.update_timestamps()
        query_model.put()

        with self.swap(feconf, 'CAN_SEND_EMAILS', True):
            user_query_services.send_email_to_qualified_users(
                self.user_query_id, 'subject', 'body',
                feconf.BULK_EMAIL_INTENT_MARKETING, 5)
        self.model_instance = user_models.UserBulkEmailsModel.get_by_id(
            self.user_id)
        query_model = user_models.UserQueryModel.get_by_id(
            self.user_query_id)
        self.sent_mail_id = query_model.sent_email_model_id
        self.job_class = (
            prod_validation_jobs_one_off.UserBulkEmailsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserBulkEmailsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserBulkEmailsModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.user_id, self.model_instance.created_on,
                self.model_instance.last_updated
            ), u'[u\'fully-validated UserBulkEmailsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        user_models.UserBulkEmailsModel.get_by_id(self.owner_id).delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserBulkEmailsModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.user_id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserBulkEmailsModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]' % (
                    self.user_id, self.user_id, self.user_id)
            ), u'[u\'fully-validated UserBulkEmailsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_sent_email_model_failure(self):
        email_models.BulkEmailModel.get_by_id(self.sent_mail_id).delete()
        expected_output = [(
            u'[u\'failed validation check for sent_email_model_ids field '
            'check of UserBulkEmailsModel\', [u"Entity id %s: based on '
            'field sent_email_model_ids having value %s, expected model '
            'BulkEmailModel with id %s but it doesn\'t exist", '
            'u"Entity id %s: based on field sent_email_model_ids having '
            'value %s, expected model BulkEmailModel with id %s but it '
            'doesn\'t exist"]]') % (
                self.user_id, self.sent_mail_id, self.sent_mail_id,
                self.owner_id, self.sent_mail_id, self.sent_mail_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)

    def test_user_id_not_in_recipient_ids(self):
        bulk_email_model = email_models.BulkEmailModel.get_by_id(
            self.sent_mail_id)
        bulk_email_model.recipient_ids.remove(self.user_id)
        bulk_email_model.update_timestamps()
        bulk_email_model.put()
        expected_output = [
            (
                u'[u\'failed validation check for recipient check of '
                'UserBulkEmailsModel\', [u\'Entity id %s: user id is '
                'not present in recipient ids of BulkEmailModel with id %s\']]'
            ) % (self.user_id, self.sent_mail_id),
            u'[u\'fully-validated UserBulkEmailsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class UserSkillMasteryModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserSkillMasteryModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_admins([self.OWNER_USERNAME])
        rubrics = [
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[0], ['Explanation 1']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[1], ['Explanation 2']),
            skill_domain.Rubric(
                constants.SKILL_DIFFICULTIES[2], ['Explanation 3'])]
        skill = skill_domain.Skill.create_default_skill(
            'skill', 'description', rubrics)
        skill_services.save_new_skill(self.owner_id, skill)
        skill_services.create_user_skill_mastery(
            self.user_id, 'skill', 0.8)

        self.model_instance = user_models.UserSkillMasteryModel.get_by_id(
            id='%s.skill' % self.user_id)
        self.job_class = (
            prod_validation_jobs_one_off.UserSkillMasteryModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserSkillMasteryModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserSkillMasteryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserSkillMasteryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserSkillMasteryModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_missing_skill_model_failure(self):
        skill_models.SkillModel.get_by_id('skill').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for skill_ids '
                'field check of UserSkillMasteryModel\', '
                '[u"Entity id %s: based on '
                'field skill_ids having value '
                'skill, expected model SkillModel '
                'with id skill but it doesn\'t exist"]]') % (
                    self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_skill_mastery(self):
        self.model_instance.degree_of_mastery = 10
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for skill mastery check '
            'of UserSkillMasteryModel\', [u\'Entity id %s: Expected degree '
            'of mastery to be in range [0.0, 1.0], received '
            '10.0\']]') % (self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class UserContributionProficiencyModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(UserContributionProficiencyModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        score_category = 'content.Art'
        self.model_instance = (
            user_models.UserContributionProficiencyModel.create(
                self.user_id, score_category, 10
            )
        )
        self.job_class = (
            prod_validation_jobs_one_off
            .UserContributionProficiencyModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserContributionProficiencyModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of UserContributionProficiencyModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'UserContributionProficiencyModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids '
                'field check of UserContributionProficiencyModel\', '
                '[u"Entity id %s: based on '
                'field user_settings_ids having value '
                '%s, expected model UserSettingsModel '
                'with id %s but it doesn\'t exist"]]') % (
                    self.model_instance.id, self.user_id, self.user_id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_invalid_score(self):
        self.model_instance.score = -1
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for score check of '
            'UserContributionProficiencyModel\', [u\'Entity id %s: '
            'Expected score to be non-negative, received -1.0\']]') % (
                self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class UserContributionRightsModelValidatorTests(test_utils.AuditJobsTestBase):

    TRANSLATOR_EMAIL = 'translator@community.org'
    TRANSLATOR_USERNAME = 'translator'

    VOICE_ARTIST_EMAIL = 'voiceartist@community.org'
    VOICE_ARTIST_USERNAME = 'voiceartist'

    def setUp(self):
        super(UserContributionRightsModelValidatorTests, self).setUp()

        self.signup(self.TRANSLATOR_EMAIL, self.TRANSLATOR_USERNAME)
        self.translator_id = self.get_user_id_from_email(self.TRANSLATOR_EMAIL)
        self.signup(self.VOICE_ARTIST_EMAIL, self.VOICE_ARTIST_USERNAME)
        self.voice_artist_id = self.get_user_id_from_email(
            self.VOICE_ARTIST_EMAIL)

        user_services.allow_user_to_review_voiceover_in_language(
            self.translator_id, 'hi')
        user_services.allow_user_to_review_voiceover_in_language(
            self.voice_artist_id, 'hi')

        self.translator_model_instance = (
            user_models.UserContributionRightsModel.get_by_id(
                self.translator_id))
        self.voice_artist_model_instance = (
            user_models.UserContributionRightsModel.get_by_id(
                self.voice_artist_id))

        self.job_class = (
            prod_validation_jobs_one_off
            .UserContributionRightsModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated UserContributionRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_get_external_id_relationship_failure(self):
        user_models.UserSettingsModel.get_by_id(self.translator_id).delete()

        expected_output = [
            (
                u'[u\'failed validation check for user_settings_ids field '
                'check of UserContributionRightsModel\', [u"Entity id %s: '
                'based on field user_settings_ids having value %s, expected '
                'model UserSettingsModel with id %s but it doesn\'t exist"]]'
            ) % (self.translator_id, self.translator_id, self.translator_id),
            u'[u\'fully-validated UserContributionRightsModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_object_validation_failure(self):
        (
            self.translator_model_instance
            .can_review_voiceover_for_language_codes.append('invalid_lang_code')
        )
        self.translator_model_instance.update_timestamps()
        self.translator_model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'UserContributionRightsModel\', [u\'Entity id %s: Entity fails '
                'domain validation with the error Invalid language_code: '
                'invalid_lang_code\']]'
            ) % self.translator_id,
            u'[u\'fully-validated UserContributionRightsModel\', 1]']

        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class PendingDeletionRequestModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(PendingDeletionRequestModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        user_services.update_user_role(
            self.user_id, feconf.ROLE_ID_TOPIC_MANAGER)
        self.user_actions = user_services.get_user_actions_info(self.user_id)

        wipeout_service.pre_delete_user(self.user_id)
        self.process_and_flush_pending_mapreduce_tasks()

        self.model_instance = (
            user_models.PendingDeletionRequestModel.get_by_id(self.user_id))

        self.job_class = (
            prod_validation_jobs_one_off
            .PendingDeletionRequestModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated PendingDeletionRequestModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of PendingDeletionRequestModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'PendingDeletionRequestModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_missing_user_settings_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for deleted '
                'user settings of PendingDeletionRequestModel\', '
                '[u\'Entity id %s: User settings model '
                'is not marked as deleted\']]') % (self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_user_settings_model_not_marked_deleted_failure(self):
        user_model = user_models.UserSettingsModel.get_by_id(self.user_id)
        user_model.deleted = False
        user_model.update_timestamps()
        user_model.put()
        expected_output = [
            (
                u'[u\'failed validation check for deleted '
                'user settings of PendingDeletionRequestModel\', '
                '[u\'Entity id %s: User settings model '
                'is not marked as deleted\']]') % (self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_incorrect_keys_in_activity_mappings(self):
        self.model_instance.pseudonymizable_entity_mappings = {
            models.NAMES.audit.value: {'some_id': 'id'}
        }
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for correct '
                'pseudonymizable_entity_mappings check of '
                'PendingDeletionRequestModel\', [u"Entity id %s: '
                'pseudonymizable_entity_mappings contains keys '
                '[u\'audit\'] that are not allowed"]]') % self.user_id]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class DeletedUserModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(DeletedUserModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        # Run the full user deletion process as it works when the user
        # pre-deletes itself via frontend and then is fully deleted via
        # subsequent cron jobs.
        wipeout_service.pre_delete_user(self.user_id)
        wipeout_service.run_user_deletion(
            wipeout_service.get_pending_deletion_request(self.user_id))
        wipeout_service.run_user_deletion_completion(
            wipeout_service.get_pending_deletion_request(self.user_id))

        self.model_instance = (
            user_models.DeletedUserModel.get_by_id(self.user_id))

        self.job_class = (
            prod_validation_jobs_one_off.DeletedUserModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated DeletedUserModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of DeletedUserModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'DeletedUserModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_existing_user_settings_model_failure(self):
        user_models.UserSettingsModel(
            id=self.user_id, email='email@email.com').put()
        expected_output = [
            (
                '[u\'failed validation check for '
                'user properly deleted of DeletedUserModel\', '
                '[u\'Entity id %s: The deletion verification fails\']]'
            ) % (self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_existing_user_contributions_model_failure(self):
        user_models.UserContributionsModel(id=self.user_id).put()
        expected_output = [
            (
                '[u\'failed validation check for '
                'user properly deleted of DeletedUserModel\', '
                '[u\'Entity id %s: The deletion verification fails\']]'
            ) % (self.model_instance.id)]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class PseudonymizedUserModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(PseudonymizedUserModelValidatorTests, self).setUp()

        self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        self.model_instance = (
            user_models.PseudonymizedUserModel(
                id=user_models.PseudonymizedUserModel.get_new_id('')))
        self.model_instance.update_timestamps()
        self.model_instance.put()

        self.job_class = (
            prod_validation_jobs_one_off.PseudonymizedUserModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated PseudonymizedUserModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of PseudonymizedUserModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'PseudonymizedUserModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)

    def test_model_not_same_id_as_user(self):
        user_models.UserSettingsModel(
            id=self.model_instance.id,
            email='email@email.com',
            username='username').put()

        expected_output = [(
            '[u\'failed validation check for deleted user settings of '
            'PseudonymizedUserModel\', '
            '[u\'Entity id %s: User settings model exists\']]'
        ) % self.model_instance.id]

        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class DeletedUsernameModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(DeletedUsernameModelValidatorTests, self).setUp()

        date_10_days_ago = (
            datetime.datetime.utcnow() - datetime.timedelta(days=10))
        with self.mock_datetime_utcnow(date_10_days_ago):
            self.signup(USER_EMAIL, USER_NAME)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        # Run the full user deletion process as it works when the user
        # pre-deletes itself via frontend and then is fully deleted via
        # subsequent cron jobs.
        wipeout_service.pre_delete_user(self.user_id)
        wipeout_service.run_user_deletion(
            wipeout_service.get_pending_deletion_request(self.user_id))
        wipeout_service.run_user_deletion_completion(
            wipeout_service.get_pending_deletion_request(self.user_id))

        self.model_instance = (
            user_models.DeletedUsernameModel.get_by_id(
                utils.convert_to_hash(
                    USER_NAME, user_models.DeletedUsernameModel.ID_LENGTH)))

        self.job_class = (
            prod_validation_jobs_one_off.DeletedUsernameModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated DeletedUsernameModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of DeletedUsernameModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance.id, self.model_instance.created_on,
                self.model_instance.last_updated
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'DeletedUsernameModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=False, literal_eval=False)
