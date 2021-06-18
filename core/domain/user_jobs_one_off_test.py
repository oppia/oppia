# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
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

"""Tests for user-related one-off computations."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import ast
import datetime
import re

from constants import constants
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import event_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import feedback_services
from core.domain import learner_progress_services
from core.domain import rating_services
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import story_domain
from core.domain import story_services
from core.domain import subscription_services
from core.domain import subtopic_page_domain
from core.domain import subtopic_page_services
from core.domain import taskqueue_services
from core.domain import topic_domain
from core.domain import topic_services
from core.domain import user_jobs_continuous
from core.domain import user_jobs_one_off
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
from core.tests.data import image_constants
import feconf
import python_utils
import utils

auth_models, user_models, feedback_models, exp_models = (
    models.Registry.import_models(
        [models.NAMES.auth, models.NAMES.user, models.NAMES.feedback,
         models.NAMES.exploration]))

datastore_services = models.Registry.import_datastore_services()
search_services = models.Registry.import_search_services()


class UserContributionsOneOffJobTests(test_utils.GenericTestBase):
    """Tests for the one-off dashboard subscriptions job."""

    EXP_ID_1 = 'exp_id_1'
    EXP_ID_2 = 'exp_id_2'
    USER_A_EMAIL = 'a@example.com'
    USER_A_USERNAME = 'a'
    USER_B_EMAIL = 'b@example.com'
    USER_B_USERNAME = 'b'
    USER_C_EMAIL = 'c@example.com'
    USER_C_USERNAME = 'c'
    USER_D_EMAIL = 'd@example.com'
    USER_D_USERNAME = 'd'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = user_jobs_one_off.UserContributionsOneOffJob.create_new()
        user_jobs_one_off.UserContributionsOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()

    def setUp(self):
        super(UserContributionsOneOffJobTests, self).setUp()
        # User A has no created or edited explorations.
        # User B has one created exploration.
        # User C has one edited exploration.
        # User D has created an exploration and then edited it.
        # (This is used to check that there are no duplicate
        # entries in the contribution lists).
        self.signup(self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.user_a_id = self.get_user_id_from_email(self.USER_A_EMAIL)
        self.signup(self.USER_B_EMAIL, self.USER_B_USERNAME)
        self.user_b_id = self.get_user_id_from_email(self.USER_B_EMAIL)
        self.signup(self.USER_C_EMAIL, self.USER_C_USERNAME)
        self.user_c_id = self.get_user_id_from_email(self.USER_C_EMAIL)
        self.signup(self.USER_D_EMAIL, self.USER_D_USERNAME)
        self.user_d_id = self.get_user_id_from_email(self.USER_D_EMAIL)

        self.save_new_valid_exploration(
            self.EXP_ID_1, self.user_b_id, end_state_name='End')

        exp_services.update_exploration(
            self.user_c_id, self.EXP_ID_1, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'the objective'
            })], 'Test edit')

        self.save_new_valid_exploration(
            self.EXP_ID_2, self.user_d_id, end_state_name='End')

        exp_services.update_exploration(
            self.user_d_id, self.EXP_ID_2, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'the objective'
            })], 'Test edit')

    def test_null_case(self):
        """Tests the case where user has no created or edited explorations."""

        self._run_one_off_job()
        user_a_contributions_model = user_models.UserContributionsModel.get(
            self.user_a_id, strict=False)
        self.assertEqual(user_a_contributions_model.created_exploration_ids, [])
        self.assertEqual(user_a_contributions_model.edited_exploration_ids, [])

    def test_created_exp(self):
        """Tests the case where user has created (and therefore edited)
        an exploration.
        """

        self._run_one_off_job()
        user_b_contributions_model = user_models.UserContributionsModel.get(
            self.user_b_id)
        self.assertEqual(
            user_b_contributions_model.created_exploration_ids, [self.EXP_ID_1])
        self.assertEqual(
            user_b_contributions_model.edited_exploration_ids, [self.EXP_ID_1])

    def test_edited_exp(self):
        """Tests the case where user has an edited exploration."""

        self._run_one_off_job()
        user_c_contributions_model = user_models.UserContributionsModel.get(
            self.user_c_id)
        self.assertEqual(
            user_c_contributions_model.created_exploration_ids, [])
        self.assertEqual(
            user_c_contributions_model.edited_exploration_ids, [self.EXP_ID_1])

    def test_for_duplicates(self):
        """Tests the case where user has an edited exploration, and edits
        it again making sure it is not duplicated.
        """

        self._run_one_off_job()
        user_d_contributions_model = user_models.UserContributionsModel.get(
            self.user_d_id)
        self.assertEqual(
            user_d_contributions_model.edited_exploration_ids,
            [self.EXP_ID_2])
        self.assertEqual(
            user_d_contributions_model.created_exploration_ids,
            [self.EXP_ID_2])

    def test_no_new_user_contributions_model_get_created_with_existing_model(
            self):
        model1 = exp_models.ExplorationSnapshotMetadataModel(
            id='exp_id-1', committer_id=self.user_a_id, commit_type='create')
        model1.update_timestamps()
        model1.put()
        user_models.UserContributionsModel(
            id=self.user_a_id,
            created_exploration_ids=['exp_id']
        ).put()

        user_contributions_model = user_models.UserContributionsModel.get(
            self.user_a_id)
        self.assertEqual(
            user_contributions_model.created_exploration_ids,
            ['exp_id'])

        self._run_one_off_job()

        user_contributions_model = user_models.UserContributionsModel.get(
            self.user_a_id)
        self.assertEqual(
            user_contributions_model.created_exploration_ids,
            ['exp_id'])

    def test_user_contributions_get_created_after_running_the_job(self):
        model1 = exp_models.ExplorationSnapshotMetadataModel(
            id='exp_id-1', committer_id='new_user', commit_type='create')
        model1.update_timestamps()
        model1.put()

        user_contributions_model = user_models.UserContributionsModel.get(
            'new_user', strict=False)
        self.assertIsNone(user_contributions_model)

        self._run_one_off_job()

        user_contributions_model = user_models.UserContributionsModel.get(
            'new_user', strict=False)
        self.assertEqual(
            user_contributions_model.created_exploration_ids,
            ['exp_id'])


class UsernameLengthDistributionOneOffJobTests(test_utils.GenericTestBase):
    """Tests for the one-off username length distribution job."""

    USER_A_EMAIL = 'a@example.com'
    USER_A_USERNAME = 'a'
    USER_B_EMAIL = 'ab@example.com'
    USER_B_USERNAME = 'ab'
    USER_C_EMAIL = 'bc@example.com'
    USER_C_USERNAME = 'bc'
    USER_D_EMAIL = 'bcd@example.com'
    USER_D_USERNAME = 'bcd'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            user_jobs_one_off.UsernameLengthDistributionOneOffJob.create_new())
        user_jobs_one_off.UsernameLengthDistributionOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        stringified_output = (
            user_jobs_one_off.UsernameLengthDistributionOneOffJob.get_output(
                job_id))
        output = {}
        for stringified_distribution in stringified_output:
            value = re.findall(r'\d+', stringified_distribution)
            # The following is output['username length'] = number of users.
            output[value[0]] = int(value[1])

        return output

    def test_null_case(self):
        """Tests the case when there are no signed up users but there is one
        default user having the username - 'tmpsuperadm1n'.
        """
        output = self._run_one_off_job()
        # Number of users = 1.
        # length of usernames = 13 (tmpsuperadm1n).
        self.assertEqual(output['13'], 1)

    def test_single_user_case(self):
        """Tests the case when there is only one signed up user and a default
        user - 'tmpsuperadm1n'.
        """
        self.signup(self.USER_A_EMAIL, self.USER_A_USERNAME)
        output = self._run_one_off_job()
        # Number of users = 2.
        # length of usernames = 13 (tmpsuperadm1n), 1 (a).
        self.assertEqual(output['13'], 1)
        self.assertEqual(output['1'], 1)

    def test_multiple_users_case(self):
        """Tests the case when there are multiple signed up users and a
        default user - 'tmpsuperadm1n'.
        """
        self.signup(self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.signup(self.USER_B_EMAIL, self.USER_B_USERNAME)
        output = self._run_one_off_job()
        # Number of users = 3
        # length of usernames = 13 (tmpsuperadm1n), 2 (ab), 1 (a).
        self.assertEqual(output['13'], 1)
        self.assertEqual(output['2'], 1)
        self.assertEqual(output['1'], 1)

        self.signup(self.USER_C_EMAIL, self.USER_C_USERNAME)
        self.signup(self.USER_D_EMAIL, self.USER_D_USERNAME)
        output = self._run_one_off_job()
        # Number of users = 5
        # length of usernames = 13 (tmpsuperadm1n), 3 (bcd), 2 (ab, bc), 1 (a).
        self.assertEqual(output['13'], 1)
        self.assertEqual(output['3'], 1)
        self.assertEqual(output['2'], 2)
        self.assertEqual(output['1'], 1)


class UsernameLengthAuditOneOffJobTests(test_utils.GenericTestBase):
    """Tests for the one-off username length limit job."""

    USER_1_EMAIL = '1@example.com'
    USER_1_USERNAME = '123456789123456789123'
    USER_2_EMAIL = '2@example.com'
    USER_2_USERNAME = '123456789123456789124'
    USER_3_EMAIL = '3@example.com'
    USER_3_USERNAME = 'a' * 30
    USER_4_EMAIL = '4@example.com'
    # Username 4 length is 20, so it shouldn't be in the output.
    USER_4_USERNAME = '12345678912345678912'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            user_jobs_one_off.UsernameLengthAuditOneOffJob.create_new())
        user_jobs_one_off.UsernameLengthAuditOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        return user_jobs_one_off.UsernameLengthAuditOneOffJob.get_output(job_id)

    def test_username_length_limit(self):
        self.signup(self.USER_1_EMAIL, self.USER_1_USERNAME)
        self.signup(self.USER_2_EMAIL, self.USER_2_USERNAME)
        self.signup(self.USER_3_EMAIL, self.USER_3_USERNAME)

        expected_output = [u'[u\'Length: 21\', u"Usernames: [\'%s\', \'%s\']"]'
                           % (self.USER_1_USERNAME, self.USER_2_USERNAME),
                           u'[u\'Length: 30\', u"Usernames: [\'%s\']"]'
                           % self.USER_3_USERNAME]

        actual_output = self._run_one_off_job()

        self.assertEqual(actual_output, expected_output)


class LongUserBiosOneOffJobTests(test_utils.GenericTestBase):
    """Tests for the one-off long userbio length job."""

    USER_A_EMAIL = 'a@example.com'
    USER_A_USERNAME = 'a'
    USER_A_BIO = 'I am less than 500'
    USER_B_EMAIL = 'b@example.com'
    USER_B_USERNAME = 'b'
    USER_B_BIO = 'Long Bio' * 100
    USER_C_EMAIL = 'c@example.com'
    USER_C_USERNAME = 'c'
    USER_C_BIO = 'Same Bio' * 100
    USER_D_EMAIL = 'd@example.com'
    USER_D_USERNAME = 'd'
    USER_D_BIO = 'Diff Bio' * 300

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            user_jobs_one_off.LongUserBiosOneOffJob.create_new())
        user_jobs_one_off.LongUserBiosOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()

        stringified_output = (
            user_jobs_one_off.LongUserBiosOneOffJob.get_output(
                job_id))
        eval_output = [ast.literal_eval(stringified_item)
                       for stringified_item in stringified_output]
        output = [[int(eval_item[0]), eval_item[1]]
                  for eval_item in eval_output]
        return output

    def test_no_userbio_returns_empty_list(self):
        """Tests the case when userbio is None."""
        self.signup(self.USER_C_EMAIL, self.USER_C_USERNAME)
        result = self._run_one_off_job()
        self.assertEqual(result, [])

    def test_short_userbio_returns_empty_list(self):
        """Tests the case where the userbio is less than 500 characters."""
        self.signup(self.USER_A_EMAIL, self.USER_A_USERNAME)
        user_id_a = self.get_user_id_from_email(self.USER_A_EMAIL)
        user_services.update_user_bio(user_id_a, self.USER_A_BIO)
        result = self._run_one_off_job()
        self.assertEqual(result, [])

    def test_long_userbio_length(self):
        """Tests the case where the userbio is more than 500 characters."""
        self.signup(self.USER_B_EMAIL, self.USER_B_USERNAME)
        user_id_b = self.get_user_id_from_email(self.USER_B_EMAIL)
        user_services.update_user_bio(user_id_b, self.USER_B_BIO)
        result = self._run_one_off_job()
        expected_result = [[800, ['b']]]
        self.assertEqual(result, expected_result)

    def test_same_userbio_length(self):
        """Tests the case where two users have same userbio length."""
        self.signup(self.USER_B_EMAIL, self.USER_B_USERNAME)
        user_id_b = self.get_user_id_from_email(self.USER_B_EMAIL)
        user_services.update_user_bio(user_id_b, self.USER_B_BIO)
        self.signup(self.USER_C_EMAIL, self.USER_C_USERNAME)
        user_id_c = self.get_user_id_from_email(self.USER_C_EMAIL)
        user_services.update_user_bio(user_id_c, self.USER_C_BIO)
        result = self._run_one_off_job()
        result[0][1].sort()
        expected_result = [[800, ['b', 'c']]]
        self.assertEqual(result, expected_result)

    def test_diff_userbio_length(self):
        """Tests the case where two users have different userbio lengths."""
        self.signup(self.USER_C_EMAIL, self.USER_C_USERNAME)
        user_id_c = self.get_user_id_from_email(self.USER_C_EMAIL)
        user_services.update_user_bio(user_id_c, self.USER_C_BIO)
        self.signup(self.USER_D_EMAIL, self.USER_D_USERNAME)
        user_id_d = self.get_user_id_from_email(self.USER_D_EMAIL)
        user_services.update_user_bio(user_id_d, self.USER_D_BIO)
        result = sorted(self._run_one_off_job(), key=lambda x: x[0])
        expected_result = [[800, ['c']], [2400, ['d']]]
        self.assertEqual(result, expected_result)

    def test_bio_length_for_users_with_no_bio(self):
        self.signup(self.USER_A_EMAIL, self.USER_A_USERNAME)
        user_id_a = self.get_user_id_from_email(self.USER_A_EMAIL)
        model1 = user_models.UserSettingsModel(
            id=user_id_a,
            email=self.USER_A_EMAIL)
        model1.update_timestamps()
        model1.put()

        result = self._run_one_off_job()

        self.assertEqual(result, [])


class PopulateStoriesAndTopicsOneOffJobTests(
        test_utils.GenericTestBase):
    """Tests for the one-off populate story_ids and partially_learnt_topics_ids
    in IncompleteActivitiesModel job."""

    EXP_ID_1 = 'exp_1'
    EXP_ID_2 = 'exp_2'
    EXP_ID_3 = 'exp_3'
    EXP_ID_4 = 'exp_4'
    STORY_ID_0 = 'story_0'
    TOPIC_ID_0 = 'topic_0'
    STORY_ID_1 = 'story_1'
    TOPIC_ID_1 = 'topic_1'
    STORY_ID_2 = 'story_2'
    USER_EMAIL = 'user@example.com'
    USER_USERNAME = 'user'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            user_jobs_one_off.PopulateStoriesAndTopicsOneOffJob.create_new())
        user_jobs_one_off.PopulateStoriesAndTopicsOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()

    def setUp(self):
        super(
            PopulateStoriesAndTopicsOneOffJobTests,
            self).setUp()

        self.signup(self.USER_EMAIL, self.USER_USERNAME)
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.set_admins([self.ADMIN_USERNAME])
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(self.USER_EMAIL)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        # Save a few explorations.
        self.save_new_valid_exploration(
            self.EXP_ID_1, self.owner_id, title='Title 1',
            category='Art', language_code='en',
            correctness_feedback_enabled=True)
        self.publish_exploration(self.owner_id, self.EXP_ID_1)
        self.save_new_valid_exploration(
            self.EXP_ID_2, self.owner_id, title='Title 2',
            category='Art', language_code='en',
            correctness_feedback_enabled=True)
        self.publish_exploration(self.owner_id, self.EXP_ID_2)
        self.save_new_valid_exploration(
            self.EXP_ID_3, self.owner_id, title='Title 3',
            category='Art', language_code='en',
            correctness_feedback_enabled=True)
        self.publish_exploration(self.owner_id, self.EXP_ID_3)
        self.save_new_valid_exploration(
            self.EXP_ID_4, self.owner_id, title='Title 4',
            category='Art', language_code='en',
            correctness_feedback_enabled=True)
        self.publish_exploration(self.owner_id, self.EXP_ID_4)

        # Save new topics and stories.
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

        changelist = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': 'node_1',
                'title': 'Title 1'
            }), story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
                'old_value': None,
                'new_value': self.EXP_ID_1,
                'node_id': 'node_1'
            }), story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': 'node_2',
                'title': 'Title 2'
            }), story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
                'old_value': None,
                'new_value': self.EXP_ID_2,
                'node_id': 'node_2'
            })
        ]
        story_services.update_story(
            self.owner_id, self.STORY_ID_0, changelist, 'Added node.')

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

        changelist = [
            story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': 'node_1',
                'title': 'Title 1'
            }), story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
                'old_value': None,
                'new_value': self.EXP_ID_3,
                'node_id': 'node_1'
            }), story_domain.StoryChange({
                'cmd': story_domain.CMD_ADD_STORY_NODE,
                'node_id': 'node_2',
                'title': 'Title 2'
            }), story_domain.StoryChange({
                'cmd': story_domain.CMD_UPDATE_STORY_NODE_PROPERTY,
                'property_name': (
                    story_domain.STORY_NODE_PROPERTY_EXPLORATION_ID),
                'old_value': None,
                'new_value': self.EXP_ID_4,
                'node_id': 'node_2'
            })
        ]

        story_services.update_story(
            self.owner_id, self.STORY_ID_1, changelist, 'Added nodes.')

        # Publish topics and stories.
        topic_services.publish_story(
            self.TOPIC_ID_0, self.STORY_ID_0, self.admin_id)
        topic_services.publish_topic(self.TOPIC_ID_0, self.admin_id)

        topic_services.publish_story(
            self.TOPIC_ID_1, self.STORY_ID_1, self.admin_id)
        topic_services.publish_topic(self.TOPIC_ID_1, self.admin_id)

    def test_adds_story_and_topic_for_one_incomplete_exp(self):
        # Mark an exploration as incomplete.
        state_name = 'state_name'
        version = 1
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_1, state_name, version)
        self.assertEqual(len(
            learner_progress_services.get_all_incomplete_exp_ids(
                self.user_id)), 1)

        self._run_one_off_job()
        self.assertEqual(len(
            learner_progress_services.get_all_incomplete_story_ids(
                self.user_id)), 1)
        self.assertEqual(len(
            learner_progress_services.get_all_partially_learnt_topic_ids(
                self.user_id)), 1)

    def test_adds_story_and_topic_for_multiple_incomplete_exp(self):
        # Mark 2 exploration in different stories as incomplete.
        state_name = 'state_name'
        version = 1
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_1, state_name, version)
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_3, state_name, version)
        self.assertEqual(len(
            learner_progress_services.get_all_incomplete_exp_ids(
                self.user_id)), 2)

        self._run_one_off_job()
        self.assertEqual(len(
            learner_progress_services.get_all_incomplete_story_ids(
                self.user_id)), 2)
        self.assertEqual(len(
            learner_progress_services.get_all_partially_learnt_topic_ids(
                self.user_id)), 2)

    def test_adds_story_and_topic_for_one_completed_exp(self):
        # Mark an exploration as completed.
        story_services.record_completed_node_in_story_context(
            self.user_id, self.STORY_ID_0, 'node_1')
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_1)
        self.assertEqual(len(
            learner_progress_services.get_all_completed_exp_ids(
                self.user_id)), 1)

        self._run_one_off_job()
        self.assertEqual(len(
            learner_progress_services.get_all_incomplete_story_ids(
                self.user_id)), 1)
        self.assertEqual(len(
            learner_progress_services.get_all_partially_learnt_topic_ids(
                self.user_id)), 1)

    def test_adds_story_and_topic_for_multiple_completed_exp(self):
        # Mark 2 explorations in different stories as completed.
        story_services.record_completed_node_in_story_context(
            self.user_id, self.STORY_ID_0, 'node_1')
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_1)
        story_services.record_completed_node_in_story_context(
            self.user_id, self.STORY_ID_1, 'node_1')
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_3)
        self.assertEqual(len(
            learner_progress_services.get_all_completed_exp_ids(
                self.user_id)), 2)

        self._run_one_off_job()
        self.assertEqual(len(
            learner_progress_services.get_all_incomplete_story_ids(
                self.user_id)), 2)
        self.assertEqual(len(
            learner_progress_services.get_all_partially_learnt_topic_ids(
                self.user_id)), 2)

    def test_adds_story_and_topic_for_one_completed_and_one_incomplete_exp(
            self):
        # Mark an exploration as completed and other as incomplete in same
        # story.
        state_name = 'state_name'
        version = 1
        story_services.record_completed_node_in_story_context(
            self.user_id, self.STORY_ID_0, 'node_1')
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_1)
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_2, state_name, version)
        self.assertEqual(len(
            learner_progress_services.get_all_completed_exp_ids(
                self.user_id)), 1)
        self.assertEqual(len(
            learner_progress_services.get_all_incomplete_exp_ids(
                self.user_id)), 1)

        self._run_one_off_job()
        self.assertEqual(len(
            learner_progress_services.get_all_incomplete_story_ids(
                self.user_id)), 1)
        self.assertEqual(len(
            learner_progress_services.get_all_partially_learnt_topic_ids(
                self.user_id)), 1)

    def test_adds_story_and_topic_for_both_incomplete_exp(self):
        # Mark two exploration as incomplete in same story.
        state_name = 'state_name'
        version = 1
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_1, state_name, version)
        learner_progress_services.mark_exploration_as_incomplete(
            self.user_id, self.EXP_ID_2, state_name, version)
        self.assertEqual(len(
            learner_progress_services.get_all_incomplete_exp_ids(
                self.user_id)), 2)

        self._run_one_off_job()
        self.assertEqual(len(
            learner_progress_services.get_all_incomplete_story_ids(
                self.user_id)), 1)
        self.assertEqual(len(
            learner_progress_services.get_all_partially_learnt_topic_ids(
                self.user_id)), 1)

    def test_does_not_add_story_and_topic_for_completed_exp(self):
        # Mark 2 exp from the same story as completed.
        story_services.record_completed_node_in_story_context(
            self.user_id, self.STORY_ID_0, 'node_1')
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_1)
        story_services.record_completed_node_in_story_context(
            self.user_id, self.STORY_ID_0, 'node_2')
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, self.EXP_ID_2)
        self.assertEqual(len(
            learner_progress_services.get_all_completed_exp_ids(
                self.user_id)), 2)

        self._run_one_off_job()
        self.assertEqual(len(
            learner_progress_services.get_all_incomplete_story_ids(
                self.user_id)), 0)
        self.assertEqual(len(
            learner_progress_services.get_all_partially_learnt_topic_ids(
                self.user_id)), 0)
        self.assertEqual(len(
            learner_progress_services.get_all_completed_story_ids(
                self.user_id)), 1)
        self.assertEqual(len(
            learner_progress_services.get_all_learnt_topic_ids(
                self.user_id)), 1)


class DashboardSubscriptionsOneOffJobTests(test_utils.GenericTestBase):
    """Tests for the one-off dashboard subscriptions job."""

    EXP_ID_1 = 'exp_id_1'
    EXP_ID_2 = 'exp_id_2'
    COLLECTION_ID_1 = 'col_id_1'
    COLLECTION_ID_2 = 'col_id_2'
    EXP_ID_FOR_COLLECTION_1 = 'id_of_exp_in_collection_1'
    USER_A_EMAIL = 'a@example.com'
    USER_A_USERNAME = 'a'
    USER_B_EMAIL = 'b@example.com'
    USER_B_USERNAME = 'b'
    USER_C_EMAIL = 'c@example.com'
    USER_C_USERNAME = 'c'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = user_jobs_one_off.DashboardSubscriptionsOneOffJob.create_new()
        user_jobs_one_off.DashboardSubscriptionsOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()

    def _null_fn(self, *args, **kwargs):
        """A mock for functions of the form subscribe_to_*() to represent
        behavior prior to the implementation of subscriptions.
        """
        pass

    def setUp(self):
        super(DashboardSubscriptionsOneOffJobTests, self).setUp()

        self.signup(self.USER_A_EMAIL, self.USER_A_USERNAME)
        self.user_a_id = self.get_user_id_from_email(self.USER_A_EMAIL)
        self.signup(self.USER_B_EMAIL, self.USER_B_USERNAME)
        self.user_b_id = self.get_user_id_from_email(self.USER_B_EMAIL)
        self.signup(self.USER_C_EMAIL, self.USER_C_USERNAME)
        self.user_c_id = self.get_user_id_from_email(self.USER_C_EMAIL)

        self.user_a = user_services.get_user_actions_info(self.user_a_id)

        with self.swap(
            subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_exploration', self._null_fn
            ):
            # User A creates and saves a new valid exploration.
            self.save_new_valid_exploration(
                self.EXP_ID_1, self.user_a_id, end_state_name='End')

    def test_null_case(self):
        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id, strict=False)
        self.assertEqual(user_b_subscriptions_model, None)

        self._run_one_off_job()

        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id, strict=False)
        self.assertEqual(user_b_subscriptions_model, None)

    def test_feedback_thread_subscription(self):
        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id, strict=False)
        user_c_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_c_id, strict=False)

        self.assertEqual(user_b_subscriptions_model, None)
        self.assertEqual(user_c_subscriptions_model, None)

        with self.swap(
            subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_exploration', self._null_fn
            ):
            # User B starts a feedback thread.
            feedback_services.create_thread(
                'exploration', self.EXP_ID_1, self.user_b_id, 'subject', 'text')
            # User C adds to that thread.
            thread_id = feedback_services.get_all_threads(
                'exploration', self.EXP_ID_1, False)[0].id
            feedback_services.create_message(
                thread_id, self.user_c_id, None, None, 'more text')

        self._run_one_off_job()

        # Both users are subscribed to the feedback thread.
        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id)
        user_c_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_c_id)

        self.assertEqual(user_b_subscriptions_model.exploration_ids, [])
        self.assertEqual(user_c_subscriptions_model.exploration_ids, [])
        self.assertEqual(
            user_b_subscriptions_model.general_feedback_thread_ids, [thread_id])
        self.assertEqual(
            user_c_subscriptions_model.general_feedback_thread_ids, [thread_id])

    def test_exploration_subscription(self):
        with self.swap(
            subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_exploration', self._null_fn
            ):
            # User A adds user B as an editor to the exploration.
            rights_manager.assign_role_for_exploration(
                self.user_a, self.EXP_ID_1, self.user_b_id,
                rights_domain.ROLE_EDITOR)
            # User A adds user C as a viewer of the exploration.
            rights_manager.assign_role_for_exploration(
                self.user_a, self.EXP_ID_1, self.user_c_id,
                rights_domain.ROLE_VIEWER)

        self._run_one_off_job()

        # Users A and B are subscribed to the exploration. User C is not.
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id)
        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id)
        user_c_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_c_id, strict=False)

        self.assertEqual(
            user_a_subscriptions_model.exploration_ids, [self.EXP_ID_1])
        self.assertEqual(
            user_b_subscriptions_model.exploration_ids, [self.EXP_ID_1])
        self.assertEqual(user_c_subscriptions_model, None)

    def test_two_explorations(self):
        with self.swap(
            subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_exploration', self._null_fn
            ):
            # User A creates and saves another valid exploration.
            self.save_new_valid_exploration(self.EXP_ID_2, self.user_a_id)

        self._run_one_off_job()

        # User A is subscribed to two explorations.
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id)

        self.assertEqual(
            sorted(user_a_subscriptions_model.exploration_ids),
            sorted([self.EXP_ID_1, self.EXP_ID_2]))

    def test_community_owned_exploration(self):
        with self.swap(
            subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_exploration', self._null_fn
            ):
            # User A adds user B as an editor to the exploration.
            rights_manager.assign_role_for_exploration(
                self.user_a, self.EXP_ID_1, self.user_b_id,
                rights_domain.ROLE_EDITOR)
            # The exploration becomes community-owned.
            rights_manager.publish_exploration(self.user_a, self.EXP_ID_1)
            rights_manager.release_ownership_of_exploration(
                self.user_a, self.EXP_ID_1)
            # User C edits the exploration.
            exp_services.update_exploration(
                self.user_c_id, self.EXP_ID_1, [], 'Update exploration')

        self._run_one_off_job()

        # User A and user B are subscribed to the exploration; user C is not.
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id)
        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id)
        user_c_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_c_id, strict=False)

        self.assertEqual(
            user_a_subscriptions_model.exploration_ids, [self.EXP_ID_1])
        self.assertEqual(
            user_b_subscriptions_model.exploration_ids, [self.EXP_ID_1])
        self.assertEqual(user_c_subscriptions_model, None)

    def test_deleted_exploration(self):
        with self.swap(
            subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_exploration', self._null_fn
            ):

            # User A deletes the exploration.
            exp_services.delete_exploration(self.user_a_id, self.EXP_ID_1)
            self.process_and_flush_pending_mapreduce_tasks()

        self._run_one_off_job()

        # User A is not subscribed to the exploration.
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id, strict=False)
        self.assertEqual(user_a_subscriptions_model, None)

    def test_collection_subscription(self):
        with self.swap(
            subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_exploration', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_collection', self._null_fn
            ):
            # User A creates and saves a new valid collection.
            self.save_new_valid_collection(
                self.COLLECTION_ID_1, self.user_a_id,
                exploration_id=self.EXP_ID_FOR_COLLECTION_1)

            # User A adds user B as an editor to the collection.
            rights_manager.assign_role_for_collection(
                self.user_a, self.COLLECTION_ID_1, self.user_b_id,
                rights_domain.ROLE_EDITOR)
            # User A adds user C as a viewer of the collection.
            rights_manager.assign_role_for_collection(
                self.user_a, self.COLLECTION_ID_1, self.user_c_id,
                rights_domain.ROLE_VIEWER)

        self._run_one_off_job()

        # Users A and B are subscribed to the collection. User C is not.
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id)
        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id)
        user_c_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_c_id, strict=False)

        self.assertEqual(
            user_a_subscriptions_model.collection_ids, [self.COLLECTION_ID_1])
        # User A is also subscribed to the exploration within the collection
        # because they created both.
        self.assertEqual(
            sorted(user_a_subscriptions_model.exploration_ids), [
                self.EXP_ID_1, self.EXP_ID_FOR_COLLECTION_1])
        self.assertEqual(
            user_b_subscriptions_model.collection_ids, [self.COLLECTION_ID_1])
        self.assertEqual(user_c_subscriptions_model, None)

    def test_two_collections(self):
        with self.swap(
            subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_exploration', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_collection', self._null_fn
            ):
            # User A creates and saves a new valid collection.
            self.save_new_valid_collection(
                self.COLLECTION_ID_1, self.user_a_id,
                exploration_id=self.EXP_ID_FOR_COLLECTION_1)

            # User A creates and saves another valid collection.
            self.save_new_valid_collection(
                self.COLLECTION_ID_2, self.user_a_id,
                exploration_id=self.EXP_ID_FOR_COLLECTION_1)

        self._run_one_off_job()

        # User A is subscribed to two collections.
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id)

        self.assertEqual(
            sorted(user_a_subscriptions_model.collection_ids),
            sorted([self.COLLECTION_ID_1, self.COLLECTION_ID_2]))

    def test_deleted_collection(self):
        with self.swap(
            subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_exploration', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_collection', self._null_fn
            ):
            # User A creates and saves a new collection.
            self.save_new_default_collection(
                self.COLLECTION_ID_1, self.user_a_id)

            # User A deletes the collection.
            collection_services.delete_collection(
                self.user_a_id, self.COLLECTION_ID_1)

            # User A deletes the exploration from earlier.
            exp_services.delete_exploration(self.user_a_id, self.EXP_ID_1)
            self.process_and_flush_pending_mapreduce_tasks()

        self._run_one_off_job()

        # User A is not subscribed to the collection.
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id, strict=False)
        self.assertEqual(user_a_subscriptions_model, None)

    def test_adding_exploration_to_collection(self):
        with self.swap(
            subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_collection', self._null_fn
            ):
            # User B creates and saves a new collection.
            self.save_new_default_collection(
                self.COLLECTION_ID_1, self.user_b_id)

            # User B adds the exploration created by user A to the collection.
            collection_services.update_collection(
                self.user_b_id, self.COLLECTION_ID_1, [{
                    'cmd': collection_domain.CMD_ADD_COLLECTION_NODE,
                    'exploration_id': self.EXP_ID_1
                }], 'Add new exploration to collection.')

        # Users A and B have no subscriptions (to either explorations or
        # collections).
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id, strict=False)
        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id, strict=False)
        self.assertEqual(user_a_subscriptions_model, None)
        self.assertEqual(user_b_subscriptions_model, None)

        self._run_one_off_job()

        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id)
        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id)

        # User B should be subscribed to the collection and user A to the
        # exploration.
        self.assertEqual(
            user_a_subscriptions_model.exploration_ids, [self.EXP_ID_1])
        self.assertEqual(
            user_a_subscriptions_model.collection_ids, [])
        self.assertEqual(
            user_b_subscriptions_model.exploration_ids, [])
        self.assertEqual(
            user_b_subscriptions_model.collection_ids, [self.COLLECTION_ID_1])

    def test_community_owned_collection(self):
        with self.swap(
            subscription_services, 'subscribe_to_thread', self._null_fn
            ), self.swap(
                subscription_services, 'subscribe_to_collection', self._null_fn
            ):
            rights_manager.publish_exploration(self.user_a, self.EXP_ID_1)

            # User A creates and saves a new valid collection.
            self.save_new_valid_collection(
                self.COLLECTION_ID_1, self.user_a_id,
                exploration_id=self.EXP_ID_1)

            # User A adds user B as an editor to the collection.
            rights_manager.assign_role_for_collection(
                self.user_a, self.COLLECTION_ID_1, self.user_b_id,
                rights_domain.ROLE_EDITOR)

            # The collection becomes community-owned.
            rights_manager.publish_collection(self.user_a, self.COLLECTION_ID_1)
            rights_manager.release_ownership_of_collection(
                self.user_a, self.COLLECTION_ID_1)

            # User C edits the collection.
            collection_services.update_collection(
                self.user_c_id, self.COLLECTION_ID_1, [{
                    'cmd': collection_domain.CMD_EDIT_COLLECTION_PROPERTY,
                    'property_name': (
                        collection_domain.COLLECTION_PROPERTY_TITLE),
                    'new_value': 'New title'
                }], 'Changed title.')

        self._run_one_off_job()

        # User A and user B are subscribed to the collection; user C is not.
        user_a_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_a_id)
        user_b_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_b_id)
        user_c_subscriptions_model = user_models.UserSubscriptionsModel.get(
            self.user_c_id, strict=False)

        self.assertEqual(
            user_a_subscriptions_model.collection_ids, [self.COLLECTION_ID_1])
        self.assertEqual(
            user_b_subscriptions_model.collection_ids, [self.COLLECTION_ID_1])
        self.assertEqual(user_c_subscriptions_model, None)


class MockUserStatsAggregator(
        user_jobs_continuous.UserStatsAggregator):
    """A modified UserStatsAggregator that does not start a new
     batch job when the previous one has finished.
    """

    @classmethod
    def _get_batch_job_manager_class(cls):
        return MockUserStatsMRJobManager

    @classmethod
    def _kickoff_batch_job_after_previous_one_ends(cls):
        pass


class MockUserStatsMRJobManager(
        user_jobs_continuous.UserStatsMRJobManager):

    @classmethod
    def _get_continuous_computation_class(cls):
        return MockUserStatsAggregator


class DashboardStatsOneOffJobTests(test_utils.GenericTestBase):
    """Tests for the one-off dashboard stats job."""

    CURRENT_DATE_AS_STRING = user_services.get_current_date_as_string()
    DATE_AFTER_ONE_WEEK = (
        (datetime.datetime.utcnow() + datetime.timedelta(7)).strftime(
            feconf.DASHBOARD_STATS_DATETIME_STRING_FORMAT))

    USER_SESSION_ID = 'session1'

    EXP_ID_1 = 'exp_id_1'
    EXP_ID_2 = 'exp_id_2'
    EXP_VERSION = 1

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = user_jobs_one_off.DashboardStatsOneOffJob.create_new()
        user_jobs_one_off.DashboardStatsOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()

    def setUp(self):
        super(DashboardStatsOneOffJobTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

    def mock_get_current_date_as_string(self):
        return self.CURRENT_DATE_AS_STRING

    def _rate_exploration(self, user_id, exp_id, rating):
        """Assigns rating to the exploration corresponding to the given
        exploration id.

        Args:
            user_id: str. The user id.
            exp_id: str. The exploration id.
            rating: int. The rating to be assigned to the given exploration.
        """
        rating_services.assign_rating_to_exploration(user_id, exp_id, rating)

    def _record_play(self, exp_id, state):
        """Calls StartExplorationEventHandler and records the 'play' event
        corresponding to the given exploration id.

        Args:
            exp_id: str. The exploration id.
            state: dict(str, *). The state of the exploration corresponding to
                the given id.
        """
        event_services.StartExplorationEventHandler.record(
            exp_id, self.EXP_VERSION, state, self.USER_SESSION_ID, {},
            feconf.PLAY_TYPE_NORMAL)

    def test_weekly_stats_if_continuous_stats_job_has_not_been_run(self):
        exploration = self.save_new_valid_exploration(
            self.EXP_ID_1, self.owner_id)
        exp_id = exploration.id
        init_state_name = exploration.init_state_name
        self._record_play(exp_id, init_state_name)
        self._rate_exploration('user1', exp_id, 5)

        weekly_stats = user_services.get_weekly_dashboard_stats(self.owner_id)
        self.assertEqual(weekly_stats, None)
        self.assertEqual(
            user_services.get_last_week_dashboard_stats(self.owner_id), None)

        with self.swap(
            user_services,
            'get_current_date_as_string',
            self.mock_get_current_date_as_string):
            self._run_one_off_job()

        weekly_stats = user_services.get_weekly_dashboard_stats(self.owner_id)
        expected_results_list = [{
            self.mock_get_current_date_as_string(): {
                'num_ratings': 0,
                'average_ratings': None,
                'total_plays': 0
            }
        }]
        self.assertEqual(weekly_stats, expected_results_list)
        self.assertEqual(
            user_services.get_last_week_dashboard_stats(self.owner_id),
            expected_results_list[0])

    def test_weekly_stats_if_no_explorations(self):
        MockUserStatsAggregator.start_computation()
        self.process_and_flush_pending_mapreduce_tasks()

        with self.swap(
            user_services,
            'get_current_date_as_string',
            self.mock_get_current_date_as_string):
            self._run_one_off_job()

        weekly_stats = user_services.get_weekly_dashboard_stats(self.owner_id)
        self.assertEqual(
            weekly_stats, [{
                self.mock_get_current_date_as_string(): {
                    'num_ratings': 0,
                    'average_ratings': None,
                    'total_plays': 0
                }
            }])

    def test_weekly_stats_for_single_exploration(self):
        exploration = self.save_new_valid_exploration(
            self.EXP_ID_1, self.owner_id)
        exp_id = exploration.id
        init_state_name = exploration.init_state_name
        self._record_play(exp_id, init_state_name)
        self._rate_exploration('user1', exp_id, 5)
        event_services.StatsEventsHandler.record(
            self.EXP_ID_1, 1, {
                'num_starts': 1,
                'num_actual_starts': 0,
                'num_completions': 0,
                'state_stats_mapping': {}
            })

        self.process_and_flush_pending_tasks()

        MockUserStatsAggregator.start_computation()
        self.process_and_flush_pending_mapreduce_tasks()

        with self.swap(
            user_services,
            'get_current_date_as_string',
            self.mock_get_current_date_as_string):
            self._run_one_off_job()

        weekly_stats = user_services.get_weekly_dashboard_stats(self.owner_id)
        self.assertEqual(
            weekly_stats, [{
                self.mock_get_current_date_as_string(): {
                    'num_ratings': 1,
                    'average_ratings': 5.0,
                    'total_plays': 1
                }
            }])

    def test_weekly_stats_for_multiple_explorations(self):
        exploration_1 = self.save_new_valid_exploration(
            self.EXP_ID_1, self.owner_id)
        exp_id_1 = exploration_1.id
        exploration_2 = self.save_new_valid_exploration(
            self.EXP_ID_2, self.owner_id)
        exp_id_2 = exploration_2.id
        init_state_name_1 = exploration_1.init_state_name
        self._record_play(exp_id_1, init_state_name_1)
        self._rate_exploration('user1', exp_id_1, 5)
        self._rate_exploration('user2', exp_id_2, 4)
        event_services.StatsEventsHandler.record(
            self.EXP_ID_1, 1, {
                'num_starts': 1,
                'num_actual_starts': 0,
                'num_completions': 0,
                'state_stats_mapping': {}
            })

        self.process_and_flush_pending_tasks()
        MockUserStatsAggregator.start_computation()
        self.process_and_flush_pending_mapreduce_tasks()

        with self.swap(
            user_services,
            'get_current_date_as_string',
            self.mock_get_current_date_as_string):
            self._run_one_off_job()

        weekly_stats = user_services.get_weekly_dashboard_stats(self.owner_id)
        self.assertEqual(
            weekly_stats, [{
                self.mock_get_current_date_as_string(): {
                    'num_ratings': 2,
                    'average_ratings': 4.5,
                    'total_plays': 1
                }
            }])

    def test_stats_for_multiple_weeks(self):
        exploration = self.save_new_valid_exploration(
            self.EXP_ID_1, self.owner_id)
        exp_id = exploration.id
        init_state_name = exploration.init_state_name
        self._rate_exploration('user1', exp_id, 4)
        self._record_play(exp_id, init_state_name)
        self._record_play(exp_id, init_state_name)
        event_services.StatsEventsHandler.record(
            self.EXP_ID_1, 1, {
                'num_starts': 2,
                'num_actual_starts': 0,
                'num_completions': 0,
                'state_stats_mapping': {}
            })

        self.process_and_flush_pending_tasks()
        MockUserStatsAggregator.start_computation()
        self.process_and_flush_pending_mapreduce_tasks()

        with self.swap(
            user_services,
            'get_current_date_as_string',
            self.mock_get_current_date_as_string):
            self._run_one_off_job()

        weekly_stats = user_services.get_weekly_dashboard_stats(self.owner_id)
        self.assertEqual(
            weekly_stats, [{
                self.mock_get_current_date_as_string(): {
                    'num_ratings': 1,
                    'average_ratings': 4.0,
                    'total_plays': 2
                }
            }])

        MockUserStatsAggregator.stop_computation(self.owner_id)
        self.process_and_flush_pending_mapreduce_tasks()

        self._rate_exploration('user2', exp_id, 2)

        MockUserStatsAggregator.start_computation()
        self.process_and_flush_pending_mapreduce_tasks()

        def _mock_get_date_after_one_week():
            """Returns the date of the next week."""
            return self.DATE_AFTER_ONE_WEEK

        with self.swap(
            user_services,
            'get_current_date_as_string',
            _mock_get_date_after_one_week):
            self._run_one_off_job()

        expected_results_list = [
            {
                self.mock_get_current_date_as_string(): {
                    'num_ratings': 1,
                    'average_ratings': 4.0,
                    'total_plays': 2
                }
            },
            {
                _mock_get_date_after_one_week(): {
                    'num_ratings': 2,
                    'average_ratings': 3.0,
                    'total_plays': 2
                }
            }
        ]
        weekly_stats = user_services.get_weekly_dashboard_stats(self.owner_id)
        self.assertEqual(weekly_stats, expected_results_list)
        self.assertEqual(
            user_services.get_last_week_dashboard_stats(self.owner_id),
            expected_results_list[1])


class UserFirstContributionMsecOneOffJobTests(test_utils.GenericTestBase):

    EXP_ID = 'test_exp'

    def setUp(self):
        super(UserFirstContributionMsecOneOffJobTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])
        self.admin = user_services.get_user_actions_info(self.admin_id)

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)

        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)

    def test_contribution_msec_updates_on_published_explorations(self):
        exploration = self.save_new_valid_exploration(
            self.EXP_ID, self.admin_id, end_state_name='End')
        init_state_name = exploration.init_state_name

        # Test that no contribution time is set.
        job_id = (
            user_jobs_one_off.UserFirstContributionMsecOneOffJob.create_new())
        user_jobs_one_off.UserFirstContributionMsecOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()
        self.assertIsNone(
            user_services.get_user_settings(
                self.admin_id).first_contribution_msec)

        # Test all owners and editors of exploration after publication have
        # updated times.
        exp_services.publish_exploration_and_update_user_profiles(
            self.admin, self.EXP_ID)
        rights_manager.release_ownership_of_exploration(
            self.admin, self.EXP_ID)
        exp_services.update_exploration(
            self.editor_id, self.EXP_ID, [exp_domain.ExplorationChange({
                'cmd': 'edit_state_property',
                'state_name': init_state_name,
                'property_name': 'widget_id',
                'new_value': 'MultipleChoiceInput'
            }), exp_domain.ExplorationChange({
                'cmd': 'edit_state_property',
                'state_name': init_state_name,
                'property_name': 'widget_customization_args',
                'new_value': {
                    'choices': {
                        'value': [{
                            'content_id': 'ca_choices_0',
                            'html': '<p>Choice 1</p>'
                        }]
                    },
                    'showChoicesInShuffledOrder': {'value': True}
                }
            })], 'commit')
        job_id = (
            user_jobs_one_off.UserFirstContributionMsecOneOffJob.create_new())
        user_jobs_one_off.UserFirstContributionMsecOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()
        self.assertIsNotNone(user_services.get_user_settings(
            self.admin_id).first_contribution_msec)
        self.assertIsNotNone(user_services.get_user_settings(
            self.editor_id).first_contribution_msec)

    def test_contribution_msec_does_not_update_on_unpublished_explorations(
            self):
        self.save_new_valid_exploration(
            self.EXP_ID, self.owner_id, end_state_name='End')
        exp_services.publish_exploration_and_update_user_profiles(
            self.owner, self.EXP_ID)
        # We now manually reset the user's first_contribution_msec to None.
        # This is to test that the one off job skips over the unpublished
        # exploration and does not reset the user's first_contribution_msec.
        user_models.UserSettingsModel(
            id=self.owner_id,
            email='email@email.com',
            username='username',
            first_contribution_msec=None
        ).put()
        rights_manager.unpublish_exploration(self.admin, self.EXP_ID)

        # Test that first contribution time is not set for unpublished
        # explorations.
        job_id = (
            user_jobs_one_off.UserFirstContributionMsecOneOffJob.create_new())
        user_jobs_one_off.UserFirstContributionMsecOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()
        self.assertIsNone(user_services.get_user_settings(
            self.owner_id).first_contribution_msec)

    def test_contribution_msec_is_not_generated_if_exploration_not_created(
            self):
        model1 = exp_models.ExplorationRightsSnapshotMetadataModel(
            id='exp_id-1', committer_id=self.owner_id, commit_type='create')
        model1.update_timestamps()
        model1.put()

        self.assertIsNone(user_services.get_user_settings(
            self.owner_id).first_contribution_msec)

        job_id = (
            user_jobs_one_off.UserFirstContributionMsecOneOffJob.create_new())
        user_jobs_one_off.UserFirstContributionMsecOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        self.assertIsNone(user_services.get_user_settings(
            self.owner_id).first_contribution_msec)


class UserLastExplorationActivityOneOffJobTests(test_utils.GenericTestBase):

    def setUp(self):
        super(UserLastExplorationActivityOneOffJobTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.exp_id = 'exp'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            user_jobs_one_off.UserLastExplorationActivityOneOffJob.create_new())
        user_jobs_one_off.UserLastExplorationActivityOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()

    def test_that_last_created_time_is_updated(self):
        self.login(self.OWNER_EMAIL)
        self.save_new_valid_exploration(
            self.exp_id, self.owner_id, end_state_name='End')
        self.logout()

        user_models.UserSettingsModel(
            id=self.owner_id,
            email=self.OWNER_EMAIL,
            last_created_an_exploration=None
        ).put()

        owner_settings = user_services.get_user_settings(self.owner_id)
        self.assertIsNone(owner_settings.last_created_an_exploration)
        self.assertIsNone(owner_settings.last_edited_an_exploration)

        self._run_one_off_job()

        owner_settings = user_services.get_user_settings(self.owner_id)
        self.assertIsNotNone(owner_settings.last_created_an_exploration)
        self.assertIsNotNone(owner_settings.last_edited_an_exploration)

    def test_that_last_edited_time_is_updated(self):
        self.login(self.OWNER_EMAIL)
        self.save_new_valid_exploration(
            self.exp_id, self.owner_id, end_state_name='End')
        self.logout()
        self.login(self.EDITOR_EMAIL)
        exp_services.update_exploration(
            self.editor_id, self.exp_id, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'the objective'
            })], 'Test edit')
        self.logout()

        user_models.UserSettingsModel(
            id=self.editor_id,
            email=self.EDITOR_EMAIL,
            last_edited_an_exploration=None
        ).put()

        editor_settings = user_services.get_user_settings(self.editor_id)

        self.assertIsNone(editor_settings.last_created_an_exploration)
        self.assertIsNone(editor_settings.last_edited_an_exploration)

        self._run_one_off_job()

        editor_settings = user_services.get_user_settings(self.editor_id)

        self.assertIsNotNone(editor_settings.last_edited_an_exploration)
        self.assertIsNone(editor_settings.last_created_an_exploration)

    def test_that_last_edited_and_created_time_both_updated(self):
        self.login(self.OWNER_EMAIL)
        self.save_new_valid_exploration(
            self.exp_id, self.owner_id, end_state_name='End')
        exp_services.update_exploration(
            self.owner_id, self.exp_id, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'the objective'
            })], 'Test edit')
        self.logout()
        self.login(self.EDITOR_EMAIL)
        exp_services.update_exploration(
            self.editor_id, self.exp_id, [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'new objective'
            })], 'Test edit new')
        self.logout()

        user_models.UserSettingsModel(
            id=self.owner_id,
            email=self.OWNER_EMAIL,
            last_created_an_exploration=None,
            last_edited_an_exploration=None
        ).put()

        user_models.UserSettingsModel(
            id=self.editor_id,
            email=self.EDITOR_EMAIL,
            last_edited_an_exploration=None
        ).put()

        owner_settings = user_services.get_user_settings(self.owner_id)
        editor_settings = user_services.get_user_settings(self.editor_id)

        self.assertIsNone(owner_settings.last_created_an_exploration)
        self.assertIsNone(owner_settings.last_edited_an_exploration)
        self.assertIsNone(editor_settings.last_created_an_exploration)
        self.assertIsNone(editor_settings.last_edited_an_exploration)

        self._run_one_off_job()

        owner_settings = user_services.get_user_settings(self.owner_id)
        editor_settings = user_services.get_user_settings(self.editor_id)

        self.assertIsNotNone(owner_settings.last_edited_an_exploration)
        self.assertIsNotNone(owner_settings.last_created_an_exploration)
        self.assertIsNotNone(editor_settings.last_edited_an_exploration)
        self.assertIsNone(editor_settings.last_created_an_exploration)

    def test_that_last_edited_and_created_time_are_not_updated(self):
        user_models.UserSettingsModel(
            id=self.owner_id,
            email=self.OWNER_EMAIL,
            last_created_an_exploration=None,
            last_edited_an_exploration=None
        ).put()

        owner_settings = user_services.get_user_settings(self.owner_id)

        self.assertIsNone(owner_settings.last_created_an_exploration)
        self.assertIsNone(owner_settings.last_edited_an_exploration)

        self._run_one_off_job()

        owner_settings = user_services.get_user_settings(self.owner_id)
        self.assertIsNone(owner_settings.last_created_an_exploration)
        self.assertIsNone(owner_settings.last_edited_an_exploration)


class CleanupUserSubscriptionsModelUnitTests(test_utils.GenericTestBase):

    def setUp(self):
        super(CleanupUserSubscriptionsModelUnitTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup('user@email', 'user')
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email('user@email')
        self.owner = user_services.get_user_actions_info(self.owner_id)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(3)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)
            rights_manager.publish_exploration(self.owner, exp.id)

        for exp in explorations:
            subscription_services.subscribe_to_exploration(
                self.user_id, exp.id)
        self.process_and_flush_pending_mapreduce_tasks()

    def test_standard_operation(self):
        for exp_id in python_utils.RANGE(3):
            exp_models.ExplorationModel.get('%s' % exp_id).delete(
                self.owner_id, 'deleted exploration')

        owner_subscription_model = user_models.UserSubscriptionsModel.get(
            self.owner_id)
        self.assertEqual(len(owner_subscription_model.exploration_ids), 3)

        user_subscription_model = user_models.UserSubscriptionsModel.get(
            self.user_id)
        self.assertEqual(len(user_subscription_model.exploration_ids), 3)

        job = (
            user_jobs_one_off
            .CleanupExplorationIdsFromUserSubscriptionsModelOneOffJob
        )
        job_id = job.create_new()
        job.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()

        owner_subscription_model = user_models.UserSubscriptionsModel.get(
            self.owner_id)
        self.assertEqual(len(owner_subscription_model.exploration_ids), 0)

        user_subscription_model = user_models.UserSubscriptionsModel.get(
            self.user_id)
        self.assertEqual(len(user_subscription_model.exploration_ids), 0)
        actual_output = job.get_output(job_id)
        expected_output = [
            u'[u\'Successfully cleaned up UserSubscriptionsModel %s and '
            'removed explorations 0, 1, 2\', 1]' %
            self.owner_id,
            u'[u\'Successfully cleaned up UserSubscriptionsModel %s and '
            'removed explorations 0, 1, 2\', 1]' %
            self.user_id]
        self.assertEqual(sorted(actual_output), sorted(expected_output))


class MockUserSettingsModelWithGaeUserId(user_models.UserSettingsModel):
    """Mock UserSettingsModel so that it allows to set `gae_user_id`."""

    gae_user_id = (
        datastore_services.StringProperty(indexed=True, required=False))


class MockUserSettingsModelWithGaeId(user_models.UserSettingsModel):
    """Mock UserSettingsModel so that it allows to set `gae_id`."""

    gae_id = (
        datastore_services.StringProperty(indexed=True, required=True))


class MockUserSubscriptionsModelWithActivityIDs(
        user_models.UserSubscriptionsModel):
    """Mock UserSubscriptionsModel so that it allows to set 'activity_ids'. """

    activity_ids = (
        datastore_services.StringProperty(indexed=True, repeated=True))


class RemoveActivityIDsOneOffJobTests(test_utils.GenericTestBase):
    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            user_jobs_one_off.RemoveActivityIDsOneOffJob.create_new())
        user_jobs_one_off.RemoveActivityIDsOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        stringified_output = (
            user_jobs_one_off.RemoveActivityIDsOneOffJob
            .get_output(job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return eval_output

    def test_one_subscription_model_with_activity_ids(self):
        with self.swap(
            user_models, 'UserSubscriptionsModel',
            MockUserSubscriptionsModelWithActivityIDs):
            original_subscription_model = (
                user_models.UserSubscriptionsModel(
                    id='id',
                    activity_ids=['exp_1', 'exp_2', 'exp_3']
                )
            )
            original_subscription_model.update_timestamps()
            original_subscription_model.put()

            self.assertIsNotNone(
                original_subscription_model.activity_ids)
            self.assertIn(
                'activity_ids', original_subscription_model._values)  # pylint: disable=protected-access
            self.assertIn(
                'activity_ids', original_subscription_model._properties)  # pylint: disable=protected-access

            output = self._run_one_off_job()
            self.assertItemsEqual(
                [['SUCCESS_REMOVED - UserSubscriptionsModel', 1]], output)

            migrated_subscription_model = (
                user_models.UserSubscriptionsModel.get_by_id('id'))

            self.assertNotIn(
                'activity_ids', migrated_subscription_model._values)  # pylint: disable=protected-access
            self.assertNotIn(
                'activity_ids', migrated_subscription_model._properties)  # pylint: disable=protected-access
            self.assertEqual(
                original_subscription_model.last_updated,
                migrated_subscription_model.last_updated)

    def test_one_subscription_model_without_activity_ids(self):
        original_subscription_model = (
            user_models.UserSubscriptionsModel(
                id='id'
            )
        )
        original_subscription_model.update_timestamps()
        original_subscription_model.put()

        self.assertNotIn(
            'activity_ids', original_subscription_model._values)  # pylint: disable=protected-access
        self.assertNotIn(
            'activity_ids', original_subscription_model._properties)  # pylint: disable=protected-access

        output = self._run_one_off_job()
        self.assertItemsEqual(
            [['SUCCESS_ALREADY_REMOVED - UserSubscriptionsModel', 1]], output)

        migrated_subscription_model = (
            user_models.UserSubscriptionsModel.get_by_id('id'))
        self.assertNotIn(
            'activity_ids', migrated_subscription_model._values)  # pylint: disable=protected-access
        self.assertNotIn(
            'activity_ids', migrated_subscription_model._properties)  # pylint: disable=protected-access
        self.assertEqual(
            original_subscription_model.last_updated,
            migrated_subscription_model.last_updated)

    def test_rerun(self):
        original_subscription_model = (
            user_models.UserSubscriptionsModel(
                id='id'
            )
        )
        original_subscription_model.update_timestamps()
        original_subscription_model.put()

        self.assertNotIn(
            'activity_ids', original_subscription_model._values)  # pylint: disable=protected-access
        self.assertNotIn(
            'activity_ids', original_subscription_model._properties)  # pylint: disable=protected-access

        output = self._run_one_off_job()
        self.assertItemsEqual(
            [['SUCCESS_ALREADY_REMOVED - UserSubscriptionsModel', 1]], output)

        migrated_subscription_model = (
            user_models.UserSubscriptionsModel.get_by_id('id'))
        self.assertNotIn(
            'activity_ids', migrated_subscription_model._values)  # pylint: disable=protected-access
        self.assertNotIn(
            'activity_ids', migrated_subscription_model._properties)  # pylint: disable=protected-access
        self.assertEqual(
            original_subscription_model.last_updated,
            migrated_subscription_model.last_updated)

        output = self._run_one_off_job()
        self.assertItemsEqual(
            [['SUCCESS_ALREADY_REMOVED - UserSubscriptionsModel', 1]], output)

        migrated_subscription_model = (
            user_models.UserSubscriptionsModel.get_by_id('id'))
        self.assertNotIn(
            'activity_ids', migrated_subscription_model._values)  # pylint: disable=protected-access
        self.assertNotIn(
            'activity_ids', migrated_subscription_model._properties)  # pylint: disable=protected-access
        self.assertEqual(
            original_subscription_model.last_updated,
            migrated_subscription_model.last_updated)


class MockUserSubscriptionsModelWithFeedbackThreadIDs(
        user_models.UserSubscriptionsModel):
    """Mock UserSubscriptionsModel so that it allows to set
    `feedback_thread_ids`.
    """

    feedback_thread_ids = (
        datastore_services.StringProperty(indexed=True, repeated=True))


class RemoveFeedbackThreadIDsOneOffJobTests(test_utils.GenericTestBase):
    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            user_jobs_one_off.RemoveFeedbackThreadIDsOneOffJob.create_new())
        user_jobs_one_off.RemoveFeedbackThreadIDsOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        stringified_output = (
            user_jobs_one_off.RemoveFeedbackThreadIDsOneOffJob
            .get_output(job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return eval_output

    def test_one_subscription_model_with_feedback_thread_ids(self):
        with self.swap(
            user_models, 'UserSubscriptionsModel',
            MockUserSubscriptionsModelWithFeedbackThreadIDs):
            original_subscription_model = (
                user_models.UserSubscriptionsModel(
                    id='id',
                    feedback_thread_ids=['some_id']
                )
            )
            original_subscription_model.update_timestamps()
            original_subscription_model.put()

            self.assertIsNotNone(
                original_subscription_model.feedback_thread_ids)
            self.assertIn(
                'feedback_thread_ids', original_subscription_model._values)  # pylint: disable=protected-access
            self.assertIn(
                'feedback_thread_ids', original_subscription_model._properties)  # pylint: disable=protected-access

            output = self._run_one_off_job()
            self.assertItemsEqual(
                [['SUCCESS_REMOVED - UserSubscriptionsModel', 1]], output)

            migrated_subscription_model = (
                user_models.UserSubscriptionsModel.get_by_id('id'))

            self.assertNotIn(
                'feedback_thread_ids', migrated_subscription_model._values)  # pylint: disable=protected-access
            self.assertNotIn(
                'feedback_thread_ids', migrated_subscription_model._properties)  # pylint: disable=protected-access
            self.assertEqual(
                original_subscription_model.last_updated,
                migrated_subscription_model.last_updated)

    def test_one_subscription_model_without_feedback_thread_ids(self):
        original_subscription_model = (
            user_models.UserSubscriptionsModel(
                id='id'
            )
        )
        original_subscription_model.update_timestamps()
        original_subscription_model.put()

        self.assertNotIn(
            'feedback_thread_ids', original_subscription_model._values)  # pylint: disable=protected-access
        self.assertNotIn(
            'feedback_thread_ids', original_subscription_model._properties)  # pylint: disable=protected-access

        output = self._run_one_off_job()
        self.assertItemsEqual(
            [['SUCCESS_ALREADY_REMOVED - UserSubscriptionsModel', 1]], output)

        migrated_subscription_model = (
            user_models.UserSubscriptionsModel.get_by_id('id'))
        self.assertNotIn(
            'feedback_thread_ids', migrated_subscription_model._values)  # pylint: disable=protected-access
        self.assertNotIn(
            'feedback_thread_ids', migrated_subscription_model._properties)  # pylint: disable=protected-access
        self.assertEqual(
            original_subscription_model.last_updated,
            migrated_subscription_model.last_updated)


class FixUserSettingsCreatedOnOneOffJobTests(test_utils.GenericTestBase):

    AUTO_CREATE_DEFAULT_SUPERADMIN_USER = False

    USER_ID_1 = 'user_id'
    USER_ID_2 = 'user_id_2'
    EMAIL_1 = 'test@email.com'
    EMAIL_2 = 'test2@email.com'
    SKILL_ID_1 = 'skill_id_1'
    SKILL_ID_2 = 'skill_id_2'
    DEGREE_OF_MASTERY = 0.5
    EXPLORATION_IDS = ['exp_1', 'exp_2', 'exp_3']
    COLLECTION_IDS = ['col_1', 'col_2', 'col_3']
    EXP_ID_ONE = 'exp_id_one'
    EXP_ID_TWO = 'exp_id_two'
    EXP_ID_THREE = 'exp_id_three'

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            user_jobs_one_off.FixUserSettingsCreatedOnOneOffJob.create_new())
        user_jobs_one_off.FixUserSettingsCreatedOnOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        stringified_output = (
            user_jobs_one_off.FixUserSettingsCreatedOnOneOffJob
            .get_output(job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        sorted_eval_output = []
        for key, values in eval_output:
            if key == 'ERROR_NOT_UP_TO_DATE_USER':
                values.sort()
            sorted_eval_output.append([key, values])
        return sorted_eval_output

    def test_update_user_model_using_all_user_settings_model_attributes(self):
        user_settings_model = (
            user_models.UserSettingsModel(
                id=self.USER_ID_1,
                email=self.EMAIL_1,
            )
        )
        user_settings_model.update_timestamps()
        original_created_on_timestamp = user_settings_model.created_on
        # last_agreed_to_terms is set to have the absolute minimum
        # timestamp value.
        user_settings_model.last_agreed_to_terms = (
            original_created_on_timestamp + datetime.timedelta(hours=2))
        final_created_on_timestamp = user_settings_model.last_agreed_to_terms
        user_settings_model.created_on = (
            final_created_on_timestamp + datetime.timedelta(days=10))
        user_settings_model.last_logged_in = (
            final_created_on_timestamp + datetime.timedelta(minutes=1))
        user_settings_model.last_started_state_editor_tutorial = (
            final_created_on_timestamp + datetime.timedelta(minutes=3))
        user_settings_model.last_updated = (
            final_created_on_timestamp + datetime.timedelta(hours=12))
        user_settings_model.last_started_state_translation_tutorial = (
            final_created_on_timestamp + datetime.timedelta(hours=14))
        user_settings_model.last_edited_an_exploration = (
            final_created_on_timestamp + datetime.timedelta(hours=15))
        user_settings_model.last_created_an_exploration = (
            final_created_on_timestamp + datetime.timedelta(hours=16))
        user_settings_model.first_contribution_msec = (
            utils.get_time_in_millisecs(
                final_created_on_timestamp + datetime.timedelta(hours=10))
        )
        user_settings_model.put()

        expected_output = [
            [
                'SUCCESS_UPDATED_USING_UserSettingsModel_last_agreed_to_terms',
                1
            ],
            ['ERROR_NOT_UP_TO_DATE_USER', [self.USER_ID_1]]
        ]
        self.assertLess(
            final_created_on_timestamp, user_settings_model.created_on)
        actual_output = self._run_one_off_job()
        self.assertItemsEqual(expected_output, actual_output)
        migrated_user_model = (
            user_models.UserSettingsModel.get_by_id(self.USER_ID_1))
        self.assertEqual(
            migrated_user_model.created_on, final_created_on_timestamp)

    def test_update_using_datetime_attributes_of_all_other_models(self):
        user_subscriptions_model = user_models.UserSubscriptionsModel(
            id=self.USER_ID_1)
        user_subscriptions_model.update_timestamps()
        # We are sequentially creating the models, so the timestamps will
        # be in increasing order, and hence created_on attribute for
        # user_subscriptions_model will have the smallest timestamp value.
        final_created_on_timestamp = user_subscriptions_model.created_on
        user_subscriptions_model.last_updated = (
            final_created_on_timestamp + datetime.timedelta(hours=2)
        )
        user_subscriptions_model.last_checked = (
            final_created_on_timestamp + datetime.timedelta(hours=3)
        )
        user_subscriptions_model.put()

        user_settings_model = (
            user_models.UserSettingsModel(
                id=self.USER_ID_1,
                email=self.EMAIL_1,
            )
        )
        user_settings_model.update_timestamps()
        user_settings_model.created_on = (
            final_created_on_timestamp + datetime.timedelta(hours=10)
        )
        user_settings_model.last_updated = (
            final_created_on_timestamp + datetime.timedelta(hours=10)
        )
        user_settings_model.put()

        exploration_user_data_model = user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.USER_ID_1, self.EXP_ID_ONE),
            user_id=self.USER_ID_1,
            exploration_id=self.EXP_ID_ONE,
            rating=2,
            rated_on=final_created_on_timestamp + datetime.timedelta(hours=1),
            draft_change_list={'new_content': {}},
            draft_change_list_last_updated=(
                final_created_on_timestamp + datetime.timedelta(hours=2)),
            draft_change_list_exp_version=3,
            draft_change_list_id=1
        )
        exploration_user_data_model.update_timestamps()
        exploration_user_data_model.created_on = (
            final_created_on_timestamp + datetime.timedelta(hours=5)
        )
        exploration_user_data_model.last_updated = (
            final_created_on_timestamp + datetime.timedelta(hours=5)
        )
        exploration_user_data_model.put()

        user_contributions_model = user_models.UserContributionsModel(
            id=self.USER_ID_1)
        user_contributions_model.update_timestamps()
        user_contributions_model.last_updated = (
            final_created_on_timestamp + datetime.timedelta(hours=5)
        )
        user_contributions_model.put()

        user_email_preferences_model = user_models.UserEmailPreferencesModel(
            id=self.USER_ID_1)
        user_email_preferences_model.update_timestamps()
        user_email_preferences_model.last_updated = (
            final_created_on_timestamp + datetime.timedelta(hours=6)
        )
        user_email_preferences_model.put()

        user_stats_model = user_models.UserStatsModel(
            id=self.USER_ID_1)
        user_stats_model.update_timestamps()
        user_stats_model.created_on = (
            final_created_on_timestamp + datetime.timedelta(hours=10)
        )
        user_stats_model.last_updated = (
            final_created_on_timestamp + datetime.timedelta(hours=10)
        )
        user_stats_model.put()

        expected_output = [
            [
                'SUCCESS_UPDATED_USING_UserSubscriptionsModel_created_on', 1
            ],
            ['ERROR_NOT_UP_TO_DATE_USER', [self.USER_ID_1]]
        ]
        self.assertLess(
            final_created_on_timestamp, user_settings_model.created_on)
        actual_output = self._run_one_off_job()
        self.assertItemsEqual(expected_output, actual_output)
        migrated_user_model = (
            user_models.UserSettingsModel.get_by_id(self.USER_ID_1))
        self.assertEqual(
            migrated_user_model.created_on, final_created_on_timestamp)

    def test_time_difference_less_than_time_delta_does_not_update(self):
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)

        user_auth_details_model = (
            auth_models.UserAuthDetailsModel.get(user_id))
        user_auth_details_model.update_timestamps()
        user_auth_details_model.put()

        user_settings_model = (
            user_models.UserSettingsModel(
                id=user_id,
                email=self.NEW_USER_EMAIL,
            )
        )
        user_settings_model.update_timestamps()
        user_settings_model.put()

        # UserAuthDetails model was created before UserSettingsModel, but the
        # time difference is less than the time_delta required (will be less
        # than a second here), hence created_on will not be updated.
        self.assertLess(
            user_auth_details_model.created_on, user_settings_model.created_on)

        expected_output = [['SUCCESS_ALREADY_UP_TO_DATE', 1]]
        actual_output = self._run_one_off_job()
        self.assertItemsEqual(expected_output, actual_output)
        migrated_user_model = (
            user_models.UserSettingsModel.get_by_id(user_id))
        self.assertNotEqual(
            migrated_user_model.created_on, user_auth_details_model.created_on)

    def test_update_for_multiple_users_works_correctly(self):
        user_settings_model_1 = (
            user_models.UserSettingsModel(
                id=self.USER_ID_1,
                email=self.EMAIL_1,
            )
        )
        user_settings_model_1.update_timestamps()
        user_settings_model_1.created_on += datetime.timedelta(hours=10)
        final_created_on_timestamp_1 = user_settings_model_1.last_updated
        user_settings_model_1.put()

        user_settings_model_2 = (
            user_models.UserSettingsModel(
                id=self.USER_ID_2,
                email=self.EMAIL_2,
            )
        )
        user_settings_model_2.update_timestamps()
        original_created_on_timestamp_2 = user_settings_model_2.created_on
        user_settings_model_2.created_on = (
            original_created_on_timestamp_2 + datetime.timedelta(hours=5))
        user_settings_model_2.last_updated = (
            original_created_on_timestamp_2 + datetime.timedelta(hours=6))
        user_settings_model_2.last_logged_in = (
            original_created_on_timestamp_2 + datetime.timedelta(hours=1))
        final_created_on_timestamp_2 = user_settings_model_2.last_logged_in
        user_settings_model_2.put()

        expected_output = [
            ['SUCCESS_UPDATED_USING_UserSettingsModel_last_updated', 1],
            ['SUCCESS_UPDATED_USING_UserSettingsModel_last_logged_in', 1],
            ['ERROR_NOT_UP_TO_DATE_USER', [self.USER_ID_1, self.USER_ID_2]]
        ]
        self.assertLess(
            final_created_on_timestamp_1, user_settings_model_1.created_on)
        self.assertLess(
            final_created_on_timestamp_2, user_settings_model_2.created_on)
        actual_output = self._run_one_off_job()
        self.assertItemsEqual(actual_output, expected_output)
        migrated_user_model_1 = (
            user_models.UserSettingsModel.get_by_id(self.USER_ID_1))
        migrated_user_model_2 = (
            user_models.UserSettingsModel.get_by_id(self.USER_ID_2))
        self.assertEqual(
            migrated_user_model_1.created_on, final_created_on_timestamp_1)
        self.assertEqual(
            migrated_user_model_2.created_on, final_created_on_timestamp_2)

    def test_multiple_runs_of_one_off_job_works_correctly(self):
        user_settings_model_1 = (
            user_models.UserSettingsModel(
                id=self.USER_ID_1,
                email=self.EMAIL_1,
            )
        )
        user_settings_model_1.update_timestamps()
        user_settings_model_1.created_on += datetime.timedelta(hours=10)
        final_created_on_timestamp_1 = user_settings_model_1.last_updated
        user_settings_model_1.put()

        user_settings_model_2 = (
            user_models.UserSettingsModel(
                id=self.USER_ID_2,
                email=self.EMAIL_2,
            )
        )
        user_settings_model_2.update_timestamps()
        user_settings_model_2.created_on += datetime.timedelta(hours=5)
        final_created_on_timestamp_2 = user_settings_model_2.last_updated
        user_settings_model_2.put()

        expected_output = [['SUCCESS_ALREADY_UP_TO_DATE', 2]]
        self.assertLess(
            final_created_on_timestamp_1, user_settings_model_1.created_on)
        self.assertLess(
            final_created_on_timestamp_2, user_settings_model_2.created_on)
        actual_output = self._run_one_off_job()
        actual_output = self._run_one_off_job()
        self.assertItemsEqual(actual_output, expected_output)
        migrated_user_model_1 = (
            user_models.UserSettingsModel.get_by_id(self.USER_ID_1))
        migrated_user_model_2 = (
            user_models.UserSettingsModel.get_by_id(self.USER_ID_2))
        self.assertEqual(
            migrated_user_model_1.created_on, final_created_on_timestamp_1)
        self.assertEqual(
            migrated_user_model_2.created_on, final_created_on_timestamp_2)


class UserSettingsCreatedOnAuditOneOffJobTests(test_utils.GenericTestBase):

    AUTO_CREATE_DEFAULT_SUPERADMIN_USER = False

    USER_ID_1 = 'user_id'
    USER_ID_2 = 'user_id_2'
    EMAIL_1 = 'test@email.com'
    EMAIL_2 = 'test2@email.com'
    SKILL_ID_1 = 'skill_id_1'
    SKILL_ID_2 = 'skill_id_2'
    DEGREE_OF_MASTERY = 0.5
    EXPLORATION_IDS = ['exp_1', 'exp_2', 'exp_3']
    COLLECTION_IDS = ['col_1', 'col_2', 'col_3']
    EXP_ID_ONE = 'exp_id_one'
    EXP_ID_TWO = 'exp_id_two'
    EXP_ID_THREE = 'exp_id_three'

    def setUp(self):
        super(UserSettingsCreatedOnAuditOneOffJobTests, self).setUp()

        self.user_settings_model = (
            user_models.UserSettingsModel(
                id=self.USER_ID_1,
                email=self.EMAIL_1,
            )
        )
        self.user_settings_model.update_timestamps()
        self.lowest_timestamp = self.user_settings_model.created_on
        self.user_settings_model.last_agreed_to_terms = (
            self.lowest_timestamp + datetime.timedelta(hours=2))
        self.user_settings_model.last_logged_in = (
            self.lowest_timestamp + datetime.timedelta(minutes=1))
        self.user_settings_model.last_started_state_editor_tutorial = (
            self.lowest_timestamp + datetime.timedelta(minutes=3))
        self.user_settings_model.last_started_state_translation_tutorial = (
            self.lowest_timestamp + datetime.timedelta(hours=14))
        self.user_settings_model.last_edited_an_exploration = (
            self.lowest_timestamp + datetime.timedelta(hours=15))
        self.user_settings_model.last_created_an_exploration = (
            self.lowest_timestamp + datetime.timedelta(hours=16))
        self.user_settings_model.first_contribution_msec = (
            utils.get_time_in_millisecs(
                self.lowest_timestamp + datetime.timedelta(
                    hours=10)
            )
        )
        self.user_settings_model.put()

        self.user_subscriptions_model = user_models.UserSubscriptionsModel(
            id=self.USER_ID_1)
        self.user_subscriptions_model.update_timestamps()
        self.user_subscriptions_model.last_checked = (
            self.lowest_timestamp + datetime.timedelta(hours=1)
        )
        self.user_subscriptions_model.put()

        self.exploration_user_data_model = user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.USER_ID_1, self.EXP_ID_ONE),
            user_id=self.USER_ID_1,
            exploration_id=self.EXP_ID_ONE,
            rating=2,
            rated_on=self.lowest_timestamp + datetime.timedelta(hours=1),
            draft_change_list={'new_content': {}},
            draft_change_list_last_updated=(
                self.lowest_timestamp + datetime.timedelta(hours=2)),
            draft_change_list_exp_version=3,
            draft_change_list_id=1
        )
        self.exploration_user_data_model.update_timestamps()
        self.exploration_user_data_model.put()

        self.user_contributions_model = user_models.UserContributionsModel(
            id=self.USER_ID_1)
        self.user_contributions_model.update_timestamps()
        self.user_contributions_model.put()

        self.user_email_preferences_model = (
            user_models.UserEmailPreferencesModel(id=self.USER_ID_1))
        self.user_email_preferences_model.update_timestamps()
        self.user_email_preferences_model.put()

        self.user_stats_model = user_models.UserStatsModel(
            id=self.USER_ID_1)
        self.user_stats_model.update_timestamps()
        self.user_stats_model.put()

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            user_jobs_one_off.UserSettingsCreatedOnAuditOneOffJob.create_new())
        user_jobs_one_off.UserSettingsCreatedOnAuditOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        stringified_output = (
            user_jobs_one_off.UserSettingsCreatedOnAuditOneOffJob
            .get_output(job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return eval_output

    def test_created_on_having_lowest_value_timestamp_yields_success(self):
        self.assertEqual(
            self.lowest_timestamp, self.user_settings_model.created_on)
        expected_output = [['SUCCESS_ALREADY_UP_TO_DATE', 1]]
        actual_output = self._run_one_off_job()
        self.assertItemsEqual(expected_output, actual_output)

    def test_created_on_within_delta_from_lowest_value_yields_success(self):
        self.user_settings_model.update_timestamps(
            update_last_updated_time=False)
        self.user_settings_model.created_on += datetime.timedelta(minutes=5)
        self.user_settings_model.put()
        self.assertLess(
            self.lowest_timestamp, self.user_settings_model.created_on)
        expected_output = [['SUCCESS_ALREADY_UP_TO_DATE', 1]]
        actual_output = self._run_one_off_job()
        self.assertItemsEqual(expected_output, actual_output)

    def test_created_on_greater_than_delta_from_lowest_value_yields_error(self):
        self.user_settings_model.update_timestamps(
            update_last_updated_time=False)
        self.user_settings_model.created_on += datetime.timedelta(minutes=6)
        self.user_settings_model.put()
        # Since last_updated of user_settings_model was never changed, hence
        # it remains the lowest timestamp value among all attributes.
        self.lowest_timestamp = self.user_settings_model.last_updated
        self.assertLess(
            self.lowest_timestamp,
            self.user_settings_model.created_on - datetime.timedelta(minutes=5))
        expected_output = [
            [
                'ERROR_NEED_TO_UPDATE_USING_UserSettingsModel_last_updated',
                [self.USER_ID_1]
            ]]
        actual_output = self._run_one_off_job()
        self.assertItemsEqual(expected_output, actual_output)

    def test_update_for_multiple_users_works_correctly(self):
        user_settings_model_2 = (
            user_models.UserSettingsModel(
                id=self.USER_ID_2,
                email=self.EMAIL_2,
            )
        )
        user_settings_model_2.update_timestamps()
        user_settings_model_2.created_on += datetime.timedelta(hours=10)
        user_settings_model_2.put()

        expected_output = [
            ['SUCCESS_ALREADY_UP_TO_DATE', 1],
            [
                'ERROR_NEED_TO_UPDATE_USING_UserSettingsModel_last_updated',
                [self.USER_ID_2]
            ]
        ]
        actual_output = self._run_one_off_job()
        self.assertItemsEqual(actual_output, expected_output)


class CleanUpUserSubscribersModelOneOffJobTests(test_utils.GenericTestBase):

    def setUp(self):
        super(CleanUpUserSubscribersModelOneOffJobTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup('user@email', 'user')
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email('user@email')

        subscription_services.subscribe_to_creator(self.user_id, self.owner_id)

        self.model_instance = user_models.UserSubscribersModel.get_by_id(
            self.owner_id)
        self.process_and_flush_pending_mapreduce_tasks()

    def test_standard_operation(self):
        job_id = (
            user_jobs_one_off.CleanUpUserSubscribersModelOneOffJob.create_new())
        user_jobs_one_off.CleanUpUserSubscribersModelOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            user_jobs_one_off.CleanUpUserSubscribersModelOneOffJob.get_output(
                job_id))
        self.assertEqual(output, [])

    def test_migration_job_skips_deleted_model(self):
        self.model_instance.subscriber_ids.append(self.owner_id)
        self.model_instance.deleted = True
        self.model_instance.update_timestamps()
        self.model_instance.put()

        job_id = (
            user_jobs_one_off.CleanUpUserSubscribersModelOneOffJob.create_new())
        user_jobs_one_off.CleanUpUserSubscribersModelOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            user_jobs_one_off.CleanUpUserSubscribersModelOneOffJob.get_output(
                job_id))
        self.assertEqual(output, [])

    def test_job_removes_user_id_from_subscriber_ids(self):
        self.model_instance.subscriber_ids.append(self.owner_id)
        self.model_instance.update_timestamps()
        self.model_instance.put()
        job_id = (
            user_jobs_one_off.CleanUpUserSubscribersModelOneOffJob.create_new())
        user_jobs_one_off.CleanUpUserSubscribersModelOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            user_jobs_one_off.CleanUpUserSubscribersModelOneOffJob.get_output(
                job_id))
        self.assertEqual(
            output, [
                '[u\'Removed user from their own subscribers list\', '
                '[u\'%s\']]' % self.owner_id])
        self.model_instance = user_models.UserSubscribersModel.get_by_id(
            self.owner_id)
        self.assertTrue(self.user_id in self.model_instance.subscriber_ids)
        self.assertTrue(self.owner_id not in self.model_instance.subscriber_ids)


class CleanUpCollectionProgressModelOneOffJobTests(test_utils.GenericTestBase):

    def setUp(self):
        super(CleanUpCollectionProgressModelOneOffJobTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.set_admins([self.OWNER_USERNAME])
        self.owner = user_services.get_user_actions_info(self.owner_id)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(3)]

        collection = collection_domain.Collection.create_default_collection(
            'col')

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)
            rights_manager.publish_exploration(self.owner, exp.id)
            collection.add_node(exp.id)

        collection_services.save_new_collection(self.owner_id, collection)
        rights_manager.publish_collection(self.owner, 'col')

        self.signup('user@email', 'user')
        self.user_id = self.get_user_id_from_email('user@email')

        learner_progress_services.mark_exploration_as_completed(
            self.user_id, '0')
        collection_services.record_played_exploration_in_collection_context(
            self.user_id, 'col', '0')
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, '1')
        collection_services.record_played_exploration_in_collection_context(
            self.user_id, 'col', '1')

        self.model_instance = user_models.CollectionProgressModel.get_by_id(
            '%s.col' % self.user_id)
        self.process_and_flush_pending_mapreduce_tasks()

    def test_standard_operation(self):
        job_id = (
            user_jobs_one_off
            .CleanUpCollectionProgressModelOneOffJob.create_new())
        user_jobs_one_off.CleanUpCollectionProgressModelOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            user_jobs_one_off
            .CleanUpCollectionProgressModelOneOffJob.get_output(job_id))
        self.assertEqual(output, [])
        self.assertEqual(
            self.model_instance.completed_explorations, ['0', '1'])

    def test_migration_job_skips_deleted_model(self):
        self.model_instance.completed_explorations.append('3')
        self.model_instance.deleted = True
        self.model_instance.update_timestamps()
        self.model_instance.put()

        job_id = (
            user_jobs_one_off
            .CleanUpCollectionProgressModelOneOffJob.create_new())
        user_jobs_one_off.CleanUpCollectionProgressModelOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            user_jobs_one_off
            .CleanUpCollectionProgressModelOneOffJob.get_output(job_id))
        self.assertEqual(output, [])

    def test_job_cleans_up_exploration_ids_not_present_in_collection(self):
        completed_activities_model = (
            user_models.CompletedActivitiesModel.get_by_id(self.user_id))
        self.assertEqual(
            completed_activities_model.exploration_ids, ['0', '1'])

        self.assertEqual(
            self.model_instance.completed_explorations, ['0', '1'])
        self.model_instance.completed_explorations.append('3')
        self.model_instance.update_timestamps()
        self.model_instance.put()
        self.assertEqual(
            self.model_instance.completed_explorations, ['0', '1', '3'])

        job_id = (
            user_jobs_one_off
            .CleanUpCollectionProgressModelOneOffJob.create_new())
        user_jobs_one_off.CleanUpCollectionProgressModelOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            user_jobs_one_off
            .CleanUpCollectionProgressModelOneOffJob.get_output(job_id))
        expected_output = [(
            '[u\'Added missing exp ids in CompletedActivitiesModel\', '
            '[u\'%s.col\']]' % self.user_id
        ), (
            '[u\'Invalid Exploration IDs cleaned from '
            'CollectionProgressModel\', '
            '[u"Model id: %s.col, Collection id: col, Removed exploration ids: '
            '[u\'3\']"]]' % self.user_id)]
        self.assertEqual(output, expected_output)
        self.model_instance = user_models.CollectionProgressModel.get_by_id(
            '%s.col' % self.user_id)
        self.assertEqual(
            self.model_instance.completed_explorations, ['0', '1'])

        completed_activities_model = (
            user_models.CompletedActivitiesModel.get_by_id(self.user_id))
        self.assertEqual(
            completed_activities_model.exploration_ids, ['0', '1', '3'])

    def test_job_creates_completed_activities_model_if_it_is_missing(self):
        completed_activities_model = (
            user_models.CompletedActivitiesModel.get_by_id(self.user_id))
        self.assertEqual(
            completed_activities_model.exploration_ids, ['0', '1'])
        completed_activities_model.delete()

        self.assertIsNone(
            user_models.CompletedActivitiesModel.get_by_id(self.user_id))

        self.assertEqual(
            self.model_instance.completed_explorations, ['0', '1'])

        job_id = (
            user_jobs_one_off
            .CleanUpCollectionProgressModelOneOffJob.create_new())
        user_jobs_one_off.CleanUpCollectionProgressModelOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            user_jobs_one_off
            .CleanUpCollectionProgressModelOneOffJob.get_output(job_id))
        self.assertEqual(
            output, [
                '[u\'Regenerated Missing CompletedActivitiesModel\', '
                '[u\'%s.col\']]' % self.user_id])

        self.assertEqual(
            self.model_instance.completed_explorations, ['0', '1'])

        completed_activities_model = (
            user_models.CompletedActivitiesModel.get_by_id(self.user_id))
        self.assertEqual(
            completed_activities_model.exploration_ids, ['0', '1'])

    def test_job_updates_completed_activities_model_if_exp_ids_do_not_match(
            self):
        learner_progress_services.mark_exploration_as_completed(
            self.user_id, '2')
        completed_activities_model = (
            user_models.CompletedActivitiesModel.get_by_id(self.user_id))
        self.assertEqual(
            completed_activities_model.exploration_ids, ['0', '1', '2'])
        completed_activities_model.exploration_ids = ['0', '2']
        completed_activities_model.update_timestamps()
        completed_activities_model.put()

        completed_activities_model = (
            user_models.CompletedActivitiesModel.get_by_id(self.user_id))
        self.assertEqual(
            completed_activities_model.exploration_ids, ['0', '2'])

        self.assertEqual(
            self.model_instance.completed_explorations, ['0', '1'])

        job_id = (
            user_jobs_one_off
            .CleanUpCollectionProgressModelOneOffJob.create_new())
        user_jobs_one_off.CleanUpCollectionProgressModelOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            user_jobs_one_off
            .CleanUpCollectionProgressModelOneOffJob.get_output(job_id))
        self.assertEqual(
            output, [
                '[u\'Added missing exp ids in CompletedActivitiesModel\', '
                '[u\'%s.col\']]' % self.user_id])

        self.assertEqual(
            self.model_instance.completed_explorations, ['0', '1'])

        completed_activities_model = (
            user_models.CompletedActivitiesModel.get_by_id(self.user_id))
        self.assertEqual(
            completed_activities_model.exploration_ids, ['0', '2', '1'])


class CleanUpUserContributionsModelOneOffJobTests(test_utils.GenericTestBase):

    def setUp(self):
        super(CleanUpUserContributionsModelOneOffJobTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup('user@email', 'user')
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email('user@email')

        self.owner = user_services.get_user_actions_info(self.owner_id)
        self.user = user_services.get_user_actions_info(self.user_id)

        self.save_new_valid_exploration(
            'exp0', self.user_id, end_state_name='End')
        self.save_new_valid_exploration(
            'exp1', self.owner_id, end_state_name='End')
        exp_services.update_exploration(
            self.user_id, 'exp1', [exp_domain.ExplorationChange({
                'cmd': 'edit_exploration_property',
                'property_name': 'objective',
                'new_value': 'the objective'
            })], 'Test edit')

        rights_manager.publish_exploration(self.user, 'exp0')
        rights_manager.publish_exploration(self.owner, 'exp1')

        self.process_and_flush_pending_mapreduce_tasks()

    def test_standard_operation(self):
        job_id = (
            user_jobs_one_off
            .CleanUpUserContributionsModelOneOffJob.create_new())
        user_jobs_one_off.CleanUpUserContributionsModelOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            user_jobs_one_off.CleanUpUserContributionsModelOneOffJob.get_output(
                job_id))
        self.assertEqual(output, [])

        model_instance_1 = user_models.UserContributionsModel.get_by_id(
            self.user_id)
        self.assertEqual(model_instance_1.created_exploration_ids, ['exp0'])
        self.assertEqual(
            model_instance_1.edited_exploration_ids, ['exp0', 'exp1'])

        model_instance_2 = user_models.UserContributionsModel.get_by_id(
            self.owner_id)
        self.assertEqual(model_instance_2.created_exploration_ids, ['exp1'])
        self.assertEqual(
            model_instance_2.edited_exploration_ids, ['exp1'])

    def test_migration_job_skips_deleted_model(self):
        model_instance = user_models.UserContributionsModel.get_by_id(
            self.user_id)
        model_instance.deleted = True
        model_instance.update_timestamps()
        model_instance.put()
        exp_services.delete_exploration(self.user_id, 'exp0')
        job_id = (
            user_jobs_one_off
            .CleanUpUserContributionsModelOneOffJob.create_new())
        user_jobs_one_off.CleanUpUserContributionsModelOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            user_jobs_one_off.CleanUpUserContributionsModelOneOffJob.get_output(
                job_id))
        self.assertEqual(output, [])

    def test_job_removes_deleted_exp_from_created_explorations(self):
        exp_services.delete_exploration(self.user_id, 'exp0')
        model_instance_1 = user_models.UserContributionsModel.get_by_id(
            self.user_id)
        self.assertEqual(model_instance_1.created_exploration_ids, ['exp0'])
        self.assertEqual(
            model_instance_1.edited_exploration_ids, ['exp0', 'exp1'])

        model_instance_2 = user_models.UserContributionsModel.get_by_id(
            self.owner_id)
        self.assertEqual(model_instance_2.created_exploration_ids, ['exp1'])
        self.assertEqual(
            model_instance_2.edited_exploration_ids, ['exp1'])

        job_id = (
            user_jobs_one_off
            .CleanUpUserContributionsModelOneOffJob.create_new())
        user_jobs_one_off.CleanUpUserContributionsModelOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            user_jobs_one_off.CleanUpUserContributionsModelOneOffJob.get_output(
                job_id))
        self.assertEqual(
            output, [
                '[u\'Removed deleted exp ids from UserContributionsModel\', '
                '[u"Model id: %s, Removed exploration ids: [u\'exp0\', '
                'u\'exp0\']"]]' % self.user_id])

        model_instance_1 = user_models.UserContributionsModel.get_by_id(
            self.user_id)
        self.assertEqual(model_instance_1.created_exploration_ids, [])
        self.assertEqual(model_instance_1.edited_exploration_ids, ['exp1'])

        model_instance_2 = user_models.UserContributionsModel.get_by_id(
            self.owner_id)
        self.assertEqual(model_instance_2.created_exploration_ids, ['exp1'])
        self.assertEqual(
            model_instance_2.edited_exploration_ids, ['exp1'])

    def test_job_removes_deleted_exp_from_edited_explorations(self):
        exp_services.delete_exploration(self.owner_id, 'exp1')
        model_instance_1 = user_models.UserContributionsModel.get_by_id(
            self.user_id)
        self.assertEqual(model_instance_1.created_exploration_ids, ['exp0'])
        self.assertEqual(
            model_instance_1.edited_exploration_ids, ['exp0', 'exp1'])

        model_instance_2 = user_models.UserContributionsModel.get_by_id(
            self.owner_id)
        self.assertEqual(model_instance_2.created_exploration_ids, ['exp1'])
        self.assertEqual(
            model_instance_2.edited_exploration_ids, ['exp1'])

        job_id = (
            user_jobs_one_off
            .CleanUpUserContributionsModelOneOffJob.create_new())
        user_jobs_one_off.CleanUpUserContributionsModelOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        output = (
            user_jobs_one_off.CleanUpUserContributionsModelOneOffJob.get_output(
                job_id))
        removed_exp_list = [
            'Model id: %s, Removed exploration ids: '
            '[u\'exp1\', u\'exp1\']' % self.owner_id,
            'Model id: %s, Removed exploration ids: '
            '[u\'exp1\']' % self.user_id]
        removed_exp_list.sort()
        self.assertEqual(
            output, [
                '[u\'Removed deleted exp ids from UserContributionsModel\', '
                '[u"%s", u"%s"]]' % (removed_exp_list[0], removed_exp_list[1])])

        model_instance_1 = user_models.UserContributionsModel.get_by_id(
            self.user_id)
        self.assertEqual(model_instance_1.created_exploration_ids, ['exp0'])
        self.assertEqual(model_instance_1.edited_exploration_ids, ['exp0'])

        model_instance_2 = user_models.UserContributionsModel.get_by_id(
            self.owner_id)
        self.assertEqual(model_instance_2.created_exploration_ids, [])
        self.assertEqual(
            model_instance_2.edited_exploration_ids, [])


class ProfilePictureAuditOneOffJobTests(test_utils.GenericTestBase):

    AUTO_CREATE_DEFAULT_SUPERADMIN_USER = False

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = user_jobs_one_off.ProfilePictureAuditOneOffJob.create_new()
        user_jobs_one_off.ProfilePictureAuditOneOffJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        stringified_output = (
            user_jobs_one_off.ProfilePictureAuditOneOffJob.get_output(job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        return eval_output

    def setUp(self):
        super(ProfilePictureAuditOneOffJobTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        user_services.generate_initial_profile_picture(self.owner_id)

    def test_correct_profile_picture_has_success_value(self):
        user_services.generate_initial_profile_picture(self.owner_id)
        output = self._run_one_off_job()
        self.assertEqual(output, [['SUCCESS', 1]])

    def test_resized_image_has_profile_picture_non_standard_dimensions_error(
            self):
        user_services.update_profile_picture_data_url(
            self.owner_id, image_constants.PNG_IMAGE_WRONG_DIMENSIONS_BASE64)
        output = self._run_one_off_job()
        self.assertEqual(
            output,
            [[
                'FAILURE - PROFILE PICTURE NON STANDARD DIMENSIONS - 150,160',
                [self.OWNER_USERNAME]
            ]]
        )

    def test_invalid_image_has_cannot_load_picture_error(self):
        user_services.update_profile_picture_data_url(
            self.owner_id, image_constants.PNG_IMAGE_BROKEN_BASE64)
        output = self._run_one_off_job()
        self.assertEqual(
            output,
            [['FAILURE - CANNOT LOAD PROFILE PICTURE', [self.OWNER_USERNAME]]]
        )

    def test_non_png_image_has_profile_picture_not_png_error(self):
        user_services.update_profile_picture_data_url(
            self.owner_id, image_constants.JPG_IMAGE_BASE64)
        output = self._run_one_off_job()
        self.assertEqual(
            output,
            [['FAILURE - PROFILE PICTURE NOT PNG', [self.OWNER_USERNAME]]]
        )

    def test_broken_base64_data_url_has_invalid_profile_picture_data_url_error(
            self):
        user_services.update_profile_picture_data_url(
            self.owner_id, image_constants.BROKEN_BASE64)
        output = self._run_one_off_job()
        self.assertEqual(
            output,
            [[
                'FAILURE - INVALID PROFILE PICTURE DATA URL',
                [self.OWNER_USERNAME]
            ]]
        )

    def test_user_without_profile_picture_has_missing_profile_picture_error(
            self):
        user_services.update_profile_picture_data_url(self.owner_id, None)
        output = self._run_one_off_job()
        self.assertEqual(
            output,
            [['FAILURE - MISSING PROFILE PICTURE', [self.OWNER_USERNAME]]]
        )

    def test_not_registered_user_has_not_registered_value(self):
        user_settings_model = (
            user_models.UserSettingsModel.get_by_id(self.owner_id))
        user_settings_model.username = None
        user_settings_model.update_timestamps()
        user_settings_model.put()
        output = self._run_one_off_job()
        self.assertEqual(output, [['SUCCESS - NOT REGISTERED', 1]])

    def test_deleted_user_has_deleted_value(self):
        user_settings_model = (
            user_models.UserSettingsModel.get_by_id(self.owner_id))
        user_settings_model.deleted = True
        user_settings_model.update_timestamps()
        user_settings_model.put()
        output = self._run_one_off_job()
        self.assertEqual(output, [['SUCCESS - DELETED', 1]])

    def test_zero_users_has_no_output(self):
        user_models.UserSettingsModel.delete_by_id(self.owner_id)
        output = self._run_one_off_job()
        self.assertEqual(output, [])

    def test_multiple_users_have_correct_values(self):
        self.signup(self.NEW_USER_EMAIL, self.NEW_USER_USERNAME)
        new_user_id = self.get_user_id_from_email(self.NEW_USER_EMAIL)
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.signup(self.MODERATOR_EMAIL, self.MODERATOR_USERNAME)
        moderator_id = self.get_user_id_from_email(self.MODERATOR_EMAIL)

        user_services.update_profile_picture_data_url(
            new_user_id, image_constants.JPG_IMAGE_BASE64)
        user_services.update_profile_picture_data_url(editor_id, None)

        user_settings_model = (
            user_models.UserSettingsModel.get_by_id(moderator_id))
        user_settings_model.deleted = True
        user_settings_model.update_timestamps()
        user_settings_model.put()

        output = self._run_one_off_job()
        self.assertItemsEqual(
            output,
            [
                ['SUCCESS', 1],
                ['FAILURE - MISSING PROFILE PICTURE', [self.EDITOR_USERNAME]],
                ['SUCCESS - DELETED', 1],
                ['FAILURE - PROFILE PICTURE NOT PNG', [self.NEW_USER_USERNAME]]
            ]
        )


class UniqueHashedNormalizedUsernameAuditJobTests(test_utils.GenericTestBase):

    AUTO_CREATE_DEFAULT_SUPERADMIN_USER = False

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            user_jobs_one_off.UniqueHashedNormalizedUsernameAuditJob
            .create_new())
        user_jobs_one_off.UniqueHashedNormalizedUsernameAuditJob.enqueue(job_id)
        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)
        self.process_and_flush_pending_mapreduce_tasks()
        stringified_output = (
            user_jobs_one_off.UniqueHashedNormalizedUsernameAuditJob.get_output(
                job_id))
        eval_output = [ast.literal_eval(stringified_item) for
                       stringified_item in stringified_output]
        for item in eval_output:
            if item[0] == 'FAILURE':
                item[1] = sorted(item[1])
        return eval_output

    def test_audit_user_with_username_is_successful(self):
        model = user_models.UserSettingsModel(id='id', email='email@email.com')
        model.update_timestamps()
        model.put()
        output = self._run_one_off_job()
        self.assertEqual(output, [['SUCCESS USERNAME NONE', 1]])

    def test_audit_users_with_different_usernames_is_successful(self):
        # Generate 4 different users.
        for i in python_utils.RANGE(4):
            model = user_models.UserSettingsModel(
                id='id%s' % i,
                email='email%s@email.com' % i,
                normalized_username='username%s' % i
            )
            model.update_timestamps()
            model.put()
        output = self._run_one_off_job()
        self.assertEqual(output, [])

    def test_audit_users_with_different_usernames_all_hashes_same_fails(self):
        # Generate 4 different users.
        for i in python_utils.RANGE(4):
            model = user_models.UserSettingsModel(
                id='id%s' % i,
                email='email%s@email.com' % i,
                normalized_username='username%s' % i
            )
            model.update_timestamps()
            model.put()

        def mock_convert_to_hash(*_):
            """Function that takes any number of arguments and returns the
            same hash for all inputs.
            """
            return 'hashhash'

        with self.swap(utils, 'convert_to_hash', mock_convert_to_hash):
            output = self._run_one_off_job()

        self.assertEqual(
            output,
            [['FAILURE', ['username%s' % i for i in python_utils.RANGE(4)]]])

    def test_audit_users_with_different_usernames_some_hashes_same_fails(self):
        # Generate 5 different users.
        for i in python_utils.RANGE(5):
            model = user_models.UserSettingsModel(
                id='id%s' % i,
                email='email%s@email.com' % i,
                normalized_username='username%s' % i
            )
            model.update_timestamps()
            model.put()

        def mock_convert_to_hash(username, _):
            """Function that takes username and returns the same hash for some
            usernames and unique hash for others.
            """
            if username in ('username1', 'username2'):
                return 'hashhash'
            return hash(username)

        with self.swap(utils, 'convert_to_hash', mock_convert_to_hash):
            output = self._run_one_off_job()

        self.assertEqual(output, [['FAILURE', ['username1', 'username2']]])


class DiscardOldDraftsOneOffJobTests(test_utils.GenericTestBase):

    EXP_USER_DATA_MODEL_ID = 'user_id.exp_id'
    USER_ID = 'user_id'
    EXP_ID = 'exp_id'

    def setUp(self):
        super(DiscardOldDraftsOneOffJobTests, self).setUp()
        self.save_new_valid_exploration(self.EXP_ID, self.USER_ID)

    def _run_job_and_verify_output(self, expected_output):
        """Runs the DiscardOldDraftsOneOffJob and verifies that the output
        matches the expected output.

        Args:
            expected_output: list(str). The expected output from the one-off
                job.
        """
        job_id = user_jobs_one_off.DiscardOldDraftsOneOffJob.create_new()
        user_jobs_one_off.DiscardOldDraftsOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()

        actual_output = user_jobs_one_off.DiscardOldDraftsOneOffJob.get_output(
            job_id)
        self.assertEqual(sorted(actual_output), sorted(expected_output))

    def _create_exp_user_data_model(self, draft_change_list, last_updated):
        """Creates a new ExplorationUserDataModel with the given parameters.

        Args:
            draft_change_list: list(dict)|None. The change list corresponding
                to the user's draft for this exploration, or None if there is
                no such draft.
            last_updated: datetime.datetime. When the draft was last updated.
        """
        user_models.ExplorationUserDataModel(
            id=self.EXP_USER_DATA_MODEL_ID,
            user_id=self.USER_ID,
            exploration_id=self.EXP_ID,
            rating=2,
            rated_on=datetime.datetime(2018, 1, 1),
            draft_change_list=draft_change_list,
            draft_change_list_last_updated=last_updated,
            draft_change_list_exp_version=3,
            draft_change_list_id=1
        ).put()

    def test_models_without_drafts_are_ignored(self):
        self._create_exp_user_data_model(None, None)
        self._run_job_and_verify_output([])

    def test_draft_left_alone_if_it_is_current(self):
        self._create_exp_user_data_model(
            {'new_content': {}}, datetime.datetime(2021, 1, 1))
        self._run_job_and_verify_output([])

    def test_draft_discarded_if_exploration_is_missing(self):
        exp_services.delete_exploration(self.USER_ID, self.EXP_ID)

        self._create_exp_user_data_model(
            {'new_content': {}}, datetime.datetime(2021, 1, 1))
        old_model = user_models.ExplorationUserDataModel.get_by_id(
            self.EXP_USER_DATA_MODEL_ID)
        self.assertIsNotNone(old_model.draft_change_list)
        self.assertIsNotNone(old_model.draft_change_list_last_updated)
        self.assertIsNotNone(old_model.draft_change_list_exp_version)

        self._run_job_and_verify_output([
            '[u\'DISCARDED - Exploration is missing\', [u\'%s\']]' %
            self.EXP_USER_DATA_MODEL_ID,
            '[u\'SUCCESS - Discarded draft\', 1]'
        ])
        new_model = user_models.ExplorationUserDataModel.get_by_id(
            self.EXP_USER_DATA_MODEL_ID)
        self.assertLess(old_model.last_updated, new_model.last_updated)
        self.assertIsNone(new_model.draft_change_list)
        self.assertIsNone(new_model.draft_change_list_last_updated)
        self.assertIsNone(new_model.draft_change_list_exp_version)

    def test_draft_discarded_if_it_is_too_old(self):
        self._create_exp_user_data_model(
            {'new_content': {}}, datetime.datetime(2017, 1, 1))
        old_model = user_models.ExplorationUserDataModel.get_by_id(
            self.EXP_USER_DATA_MODEL_ID)
        self.assertIsNotNone(old_model.draft_change_list)
        self.assertIsNotNone(old_model.draft_change_list_last_updated)
        self.assertIsNotNone(old_model.draft_change_list_exp_version)

        self._run_job_and_verify_output([
            '[u\'DISCARDED - Draft is old\', [u\'%s\']]' %
            self.EXP_USER_DATA_MODEL_ID,
            '[u\'SUCCESS - Discarded draft\', 1]'
        ])
        new_model = user_models.ExplorationUserDataModel.get_by_id(
            self.EXP_USER_DATA_MODEL_ID)
        self.assertLess(old_model.last_updated, new_model.last_updated)
        self.assertIsNone(new_model.draft_change_list)
        self.assertIsNone(new_model.draft_change_list_last_updated)
        self.assertIsNone(new_model.draft_change_list_exp_version)


class UserRolesPopulationOneOffJobTests(test_utils.GenericTestBase):
    """Tests for the UserRolesPopulationOneOffJob."""

    AUTO_CREATE_DEFAULT_SUPERADMIN_USER = False

    def _run_one_off_job(self):
        """Runs the one-off MapReduce job."""
        job_id = (
            user_jobs_one_off.UserRolesPopulationOneOffJob.create_new())
        user_jobs_one_off.UserRolesPopulationOneOffJob.enqueue(job_id)

        self.assertEqual(
            self.count_jobs_in_mapreduce_taskqueue(
                taskqueue_services.QUEUE_NAME_ONE_OFF_JOBS), 1)

        self.process_and_flush_pending_mapreduce_tasks()
        return user_jobs_one_off.UserRolesPopulationOneOffJob.get_output(job_id)

    def test_job_updates_roles_field_with_role(self):
        model = user_models.UserSettingsModel(
            id='user-id',
            email='email@email.com',
            normalized_username='username',
            role=feconf.ROLE_ID_COLLECTION_EDITOR)
        model.update_timestamps()
        model.put()

        old_user_model = user_models.UserSettingsModel.get('user-id')
        self.assertEqual(old_user_model.roles, [])

        actual_output = self._run_one_off_job()

        expected_output = ['[u\'SUCCESS\', 1]']
        self.assertEqual(actual_output, expected_output)

        new_user_model = user_models.UserSettingsModel.get('user-id')

        self.assertEqual(
            new_user_model.roles, [
                feconf.ROLE_ID_EXPLORATION_EDITOR,
                feconf.ROLE_ID_COLLECTION_EDITOR])
        self.assertFalse(new_user_model.banned)
        self.assertEqual(
            new_user_model.last_updated, old_user_model.last_updated)

    def test_job_updates_banned_field_with_role(self):
        model = user_models.UserSettingsModel(
            id='user-id',
            email='email@email.com',
            normalized_username='username',
            role=feconf.ROLE_ID_BANNED_USER)
        model.update_timestamps()
        model.put()

        old_user_model = user_models.UserSettingsModel.get('user-id')
        self.assertEqual(old_user_model.roles, [])

        actual_output = self._run_one_off_job()

        expected_output = ['[u\'SUCCESS\', 1]']
        self.assertEqual(actual_output, expected_output)

        new_user_model = user_models.UserSettingsModel.get('user-id')

        self.assertTrue(new_user_model.banned)
        self.assertEqual(new_user_model.roles, [])
        self.assertEqual(
            new_user_model.last_updated, old_user_model.last_updated)


class DeleteNonExistentExpsFromUserModelsOneOffJobTests(
        test_utils.GenericTestBase):

    EXP_USER_DATA_MODEL_ID = 'user_id.exp_id'
    USER_1_ID = 'user_1_id'
    USER_2_ID = 'user_2_id'
    USER_3_ID = 'user_3_id'
    EXP_1_ID = 'exp_1_id'
    EXP_2_ID = 'exp_2_id'

    def setUp(self):
        super(DeleteNonExistentExpsFromUserModelsOneOffJobTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)
        self.save_new_valid_exploration(self.EXP_1_ID, self.owner_id)
        self.save_new_valid_exploration(self.EXP_2_ID, self.owner_id)
        user_models.CompletedActivitiesModel(
            id=self.USER_1_ID, exploration_ids=[self.EXP_2_ID]
        ).put()
        user_models.UserSubscriptionsModel(
            id=self.USER_1_ID, exploration_ids=[self.EXP_1_ID, self.EXP_2_ID]
        ).put()
        user_models.IncompleteActivitiesModel(
            id=self.USER_2_ID, exploration_ids=[self.EXP_1_ID, self.EXP_2_ID]
        ).put()
        user_models.IncompleteActivitiesModel(
            id=self.USER_3_ID, exploration_ids=[self.EXP_1_ID]).put()
        user_models.CompletedActivitiesModel(
            id=self.USER_3_ID, exploration_ids=[self.EXP_2_ID]).put()
        user_models.UserSubscriptionsModel(
            id=self.USER_3_ID, exploration_ids=[self.EXP_2_ID]
        ).put()

    def _run_job_and_verify_output(self, expected_output):
        """Runs the DeleteNonExistentExpsFromUserModelsOneOffJob and verifies
        that the output matches the expected output.

        Args:
            expected_output: list(str). The expected output from the one-off
                job.
        """
        job_id = (
            user_jobs_one_off.DeleteNonExistentExpsFromUserModelsOneOffJob
            .create_new()
        )
        user_jobs_one_off.DeleteNonExistentExpsFromUserModelsOneOffJob.enqueue(
            job_id)
        self.process_and_flush_pending_mapreduce_tasks()
        stringified_output = (
            user_jobs_one_off.DeleteNonExistentExpsFromUserModelsOneOffJob
            .get_output(job_id)
        )
        eval_output = [
            ast.literal_eval(stringified_item)
            for stringified_item in stringified_output
        ]
        self.assertItemsEqual(eval_output, expected_output)

    def test_public_explorations_not_removed(self):
        rights_manager.publish_exploration(self.owner, self.EXP_1_ID)
        rights_manager.publish_exploration(self.owner, self.EXP_2_ID)

        self._run_job_and_verify_output([
            ['SUCCESS - CompletedActivitiesModel', 2],
            ['SUCCESS - IncompleteActivitiesModel', 2],
            ['SUCCESS - UserSubscriptionsModel', 3]
        ])

        self.assertEqual(
            user_models.CompletedActivitiesModel.get(
                self.USER_1_ID
            ).exploration_ids,
            [self.EXP_2_ID]
        )
        self.assertEqual(
            user_models.UserSubscriptionsModel.get(
                self.USER_1_ID
            ).exploration_ids,
            [self.EXP_1_ID, self.EXP_2_ID]
        )
        self.assertEqual(
            user_models.IncompleteActivitiesModel.get(
                self.USER_2_ID
            ).exploration_ids,
            [self.EXP_1_ID, self.EXP_2_ID]
        )
        self.assertEqual(
            user_models.IncompleteActivitiesModel.get(
                self.USER_3_ID
            ).exploration_ids,
            [self.EXP_1_ID]
        )
        self.assertEqual(
            user_models.CompletedActivitiesModel.get(
                self.USER_3_ID
            ).exploration_ids,
            [self.EXP_2_ID]
        )
        self.assertEqual(
            user_models.UserSubscriptionsModel.get(
                self.USER_3_ID
            ).exploration_ids,
            [self.EXP_2_ID]
        )

    def test_private_explorations_are_removed(self):
        rights_manager.publish_exploration(self.owner, self.EXP_1_ID)
        self._run_job_and_verify_output([
            ['REMOVED_PRIVATE_EXPS - CompletedActivitiesModel', 2],
            ['REMOVED_PRIVATE_EXPS - IncompleteActivitiesModel', 1],
            ['SUCCESS - CompletedActivitiesModel', 2],
            ['SUCCESS - IncompleteActivitiesModel', 2],
            ['SUCCESS - UserSubscriptionsModel', 3]
        ])

        self.assertEqual(
            user_models.CompletedActivitiesModel.get(
                self.USER_1_ID
            ).exploration_ids,
            []
        )
        self.assertEqual(
            user_models.CompletedActivitiesModel.get(
                self.USER_3_ID
            ).exploration_ids,
            []
        )
        self.assertEqual(
            user_models.IncompleteActivitiesModel.get(
                self.USER_2_ID
            ).exploration_ids,
            [self.EXP_1_ID]
        )
        self.assertEqual(
            user_models.IncompleteActivitiesModel.get(
                self.USER_3_ID
            ).exploration_ids,
            [self.EXP_1_ID]
        )

    def test_deleted_explorations_are_removed(self):
        rights_manager.publish_exploration(self.owner, self.EXP_2_ID)
        exp_services.delete_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.EXP_1_ID, force_deletion=True)
        self._run_job_and_verify_output([
            ['REMOVED_DELETED_EXPS - IncompleteActivitiesModel', 2],
            ['REMOVED_DELETED_EXPS - UserSubscriptionsModel', 2],
            ['SUCCESS - CompletedActivitiesModel', 2],
            ['SUCCESS - IncompleteActivitiesModel', 2],
            ['SUCCESS - UserSubscriptionsModel', 3]
        ])

        self.assertEqual(
            user_models.CompletedActivitiesModel.get(
                self.USER_1_ID
            ).exploration_ids,
            [self.EXP_2_ID]
        )
        self.assertEqual(
            user_models.CompletedActivitiesModel.get(
                self.USER_3_ID
            ).exploration_ids,
            [self.EXP_2_ID]
        )
        self.assertEqual(
            user_models.IncompleteActivitiesModel.get(
                self.USER_2_ID
            ).exploration_ids,
            [self.EXP_2_ID]
        )
        self.assertEqual(
            user_models.IncompleteActivitiesModel.get(
                self.USER_3_ID
            ).exploration_ids,
            []
        )
        self.assertEqual(
            user_models.UserSubscriptionsModel.get(
                self.USER_1_ID
            ).exploration_ids,
            [self.EXP_2_ID]
        )
        self.assertEqual(
            user_models.UserSubscriptionsModel.get(
                self.USER_3_ID
            ).exploration_ids,
            [self.EXP_2_ID]
        )


class DeleteNonExistentExpUserDataOneOffJobTests(test_utils.GenericTestBase):

    USER_1_ID = 'user_1_id'
    USER_2_ID = 'user_2_id'
    EXP_1_ID = 'exp_1_id'
    EXP_2_ID = 'exp_2_id'

    def setUp(self):
        super(DeleteNonExistentExpUserDataOneOffJobTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)
        self.save_new_valid_exploration(self.EXP_1_ID, self.owner_id)
        self.save_new_valid_exploration(self.EXP_2_ID, self.owner_id)
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.USER_1_ID, self.EXP_1_ID),
            user_id=self.USER_1_ID,
            exploration_id=self.EXP_1_ID,
        ).put()
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.USER_2_ID, self.EXP_1_ID),
            user_id=self.USER_2_ID,
            exploration_id=self.EXP_1_ID,
        ).put()
        user_models.ExplorationUserDataModel(
            id='%s.%s' % (self.USER_1_ID, self.EXP_2_ID),
            user_id=self.USER_1_ID,
            exploration_id=self.EXP_2_ID,
        ).put()

    def _run_job_and_verify_output(self, expected_output):
        """Runs the DeleteNonExistentExpUserDataOneOffJob and verifies that
        the output matches the expected output.

        Args:
            expected_output: list(str). The expected output from the one-off
                job.
        """
        job_id = (
            user_jobs_one_off.DeleteNonExistentExpUserDataOneOffJob.create_new()
        )
        user_jobs_one_off.DeleteNonExistentExpUserDataOneOffJob.enqueue(job_id)
        self.process_and_flush_pending_mapreduce_tasks()
        stringified_output = (
            user_jobs_one_off.DeleteNonExistentExpUserDataOneOffJob.get_output(
                job_id)
        )
        eval_output = [
            ast.literal_eval(stringified_item)
            for stringified_item in stringified_output
        ]
        self.assertItemsEqual(eval_output, expected_output)

    def test_not_deleted_explorations_not_removed(self):
        rights_manager.publish_exploration(self.owner, self.EXP_1_ID)
        rights_manager.publish_exploration(self.owner, self.EXP_2_ID)

        self._run_job_and_verify_output([['SUCCESS_KEPT', 3]])

        self.assertIsNotNone(
            user_models.ExplorationUserDataModel.get(
                self.USER_1_ID, self.EXP_1_ID
            )
        )
        self.assertIsNotNone(
            user_models.ExplorationUserDataModel.get(
                self.USER_2_ID, self.EXP_1_ID
            )
        )

    def test_deleted_explorations_are_removed(self):
        exp_models.ExplorationModel.delete_by_id(self.EXP_1_ID)

        self._run_job_and_verify_output([
            ['SUCCESS_DELETED_EXPLORATION', 2], ['SUCCESS_KEPT', 1]
        ])
        self.process_and_flush_pending_tasks()

        self.assertIsNone(
            user_models.ExplorationUserDataModel.get(
                self.USER_1_ID, self.EXP_1_ID
            )
        )
        self.assertIsNone(
            user_models.ExplorationUserDataModel.get(
                self.USER_2_ID, self.EXP_1_ID
            )
        )


class DeleteNonExistentExpUserContributionsOneOffJobTests(
        test_utils.GenericTestBase):

    EXP_USER_DATA_MODEL_ID = 'user_id.exp_id'
    USER_1_ID = 'user_1_id'
    USER_2_ID = 'user_2_id'
    USER_3_ID = 'user_3_id'
    EXP_1_ID = 'exp_1_id'
    EXP_2_ID = 'exp_2_id'
    EXP_3_ID = 'exp_3_id'

    def setUp(self):
        super(DeleteNonExistentExpUserContributionsOneOffJobTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)
        self.save_new_valid_exploration(self.EXP_1_ID, self.owner_id)
        self.save_new_valid_exploration(self.EXP_2_ID, self.owner_id)
        self.save_new_valid_exploration(self.EXP_3_ID, self.owner_id)
        user_models.UserContributionsModel(
            id=self.USER_1_ID,
            created_exploration_ids=[self.EXP_1_ID],
            edited_exploration_ids=[self.EXP_2_ID]
        ).put()
        user_models.UserContributionsModel(
            id=self.USER_2_ID,
            created_exploration_ids=[],
            edited_exploration_ids=[self.EXP_2_ID, self.EXP_3_ID]
        ).put()
        user_models.UserContributionsModel(
            id=self.USER_3_ID,
            created_exploration_ids=[self.EXP_2_ID, self.EXP_3_ID],
            edited_exploration_ids=[]
        ).put()

    def _run_job_and_verify_output(self, expected_output):
        """Runs the DeleteNonExistentExpUserContributionsOneOffJob and verifies
        that the output matches the expected output.

        Args:
            expected_output: list(str). The expected output from the one-off
                job.
        """
        job_id = (
            user_jobs_one_off.DeleteNonExistentExpUserContributionsOneOffJob
            .create_new()
        )
        (
            user_jobs_one_off.DeleteNonExistentExpUserContributionsOneOffJob
            .enqueue(job_id)
        )
        self.process_and_flush_pending_mapreduce_tasks()
        stringified_output = (
            user_jobs_one_off.DeleteNonExistentExpUserContributionsOneOffJob
            .get_output(job_id)
        )
        eval_output = [
            ast.literal_eval(stringified_item)
            for stringified_item in stringified_output
        ]
        self.assertItemsEqual(eval_output, expected_output)

    def test_not_deleted_explorations_not_removed(self):
        self._run_job_and_verify_output([['SUCCESS', 5]])

        self.assertEqual(
            user_models.UserContributionsModel.get(
                self.USER_1_ID
            ).created_exploration_ids,
            [self.EXP_1_ID]
        )
        self.assertEqual(
            user_models.UserContributionsModel.get(
                self.USER_1_ID
            ).edited_exploration_ids,
            [self.EXP_2_ID]
        )
        self.assertEqual(
            user_models.UserContributionsModel.get(
                self.USER_2_ID
            ).edited_exploration_ids,
            [self.EXP_2_ID, self.EXP_3_ID]
        )
        self.assertEqual(
            user_models.UserContributionsModel.get(
                self.USER_3_ID
            ).created_exploration_ids,
            [self.EXP_2_ID, self.EXP_3_ID]
        )

    def test_deleted_explorations_are_removed(self):
        exp_services.delete_exploration(
            feconf.SYSTEM_COMMITTER_ID, self.EXP_2_ID, force_deletion=True)
        self._run_job_and_verify_output([
            ['SUCCESS', 5],
            ['REMOVED_CREATED_DELETED_EXPS', 2],
            ['REMOVED_EDITED_DELETED_EXPS', 3]
        ])

        self.assertEqual(
            user_models.UserContributionsModel.get(
                self.USER_1_ID
            ).edited_exploration_ids,
            []
        )
        self.assertEqual(
            user_models.UserContributionsModel.get(
                self.USER_2_ID
            ).edited_exploration_ids,
            [self.EXP_3_ID]
        )
        self.assertEqual(
            user_models.UserContributionsModel.get(
                self.USER_3_ID
            ).created_exploration_ids,
            [self.EXP_3_ID]
        )
