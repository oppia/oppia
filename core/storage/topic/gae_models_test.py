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

"""Tests for Topic model."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from constants import constants
from core.domain import subtopic_page_domain
from core.domain import topic_domain
from core.domain import topic_services
from core.platform import models
from core.tests import test_utils
import feconf

(base_models, topic_models, user_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.topic, models.NAMES.user])


class TopicModelUnitTests(test_utils.GenericTestBase):
    """Tests the TopicModel class."""
    TOPIC_NAME = 'tOpic_NaMe'
    TOPIC_CANONICAL_NAME = 'topic_name'
    TOPIC_ID = 'topic_id'

    def test_get_deletion_policy(self):
        self.assertEqual(
            topic_models.TopicModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP_IF_PUBLIC)

    def test_has_reference_to_user_id(self):
        self.save_new_topic(
            'topic_id', 'owner_id', name='name',
            abbreviated_name='abbrev', thumbnail_filename=None,
            description='description', canonical_story_ids=[],
            additional_story_ids=[], uncategorized_skill_ids=[],
            subtopics=[], next_subtopic_id=0)
        self.assertTrue(
            topic_models.TopicModel.has_reference_to_user_id('owner_id'))
        self.assertFalse(
            topic_models.TopicModel.has_reference_to_user_id('x_id'))

    def test_get_user_id_migration_policy(self):
        self.assertEqual(
            topic_models.TopicModel.get_user_id_migration_policy(),
            base_models.USER_ID_MIGRATION_POLICY.NOT_APPLICABLE)

    def test_that_subsidiary_models_are_created_when_new_model_is_saved(self):
        """Tests the _trusted_commit() method."""

        topic_rights = topic_models.TopicRightsModel(
            id=self.TOPIC_ID,
            manager_ids=[],
            topic_is_published=True
        )
        # Topic is created but not committed/saved.
        topic = topic_models.TopicModel(
            id=self.TOPIC_ID,
            name=self.TOPIC_NAME,
            abbreviated_name='abbrev',
            canonical_name=self.TOPIC_CANONICAL_NAME,
            subtopic_schema_version=feconf.CURRENT_SUBTOPIC_SCHEMA_VERSION,
            story_reference_schema_version=(
                feconf.CURRENT_STORY_REFERENCE_SCHEMA_VERSION),
            next_subtopic_id=1,
            language_code='en'
        )
        # We check that topic has not been saved before calling commit().
        self.assertIsNone(topic_models.TopicModel.get_by_name(self.TOPIC_NAME))
        # We call commit() expecting that _trusted_commit works fine
        # and saves topic to datastore.
        topic_rights.commit(
            committer_id=feconf.SYSTEM_COMMITTER_ID,
            commit_message='Created new topic rights',
            commit_cmds=[{'cmd': topic_domain.CMD_CREATE_NEW}]
        )
        topic.commit(
            committer_id=feconf.SYSTEM_COMMITTER_ID,
            commit_message='Created new topic',
            commit_cmds=[{'cmd': topic_domain.CMD_CREATE_NEW}]
        )
        # Now we check that topic is not None and that actually
        # now topic exists, that means that commit() worked fine.
        self.assertIsNotNone(
            topic_models.TopicModel.get_by_name(self.TOPIC_NAME)
        )

    def test_get_by_name(self):
        topic = topic_domain.Topic.create_default_topic(
            topic_id=self.TOPIC_ID,
            name=self.TOPIC_NAME,
            abbreviated_name='abbrev'
        )
        topic_services.save_new_topic(feconf.SYSTEM_COMMITTER_ID, topic)
        self.assertEqual(
            topic_models.TopicModel.get_by_name(self.TOPIC_NAME).name,
            self.TOPIC_NAME
        )
        self.assertEqual(
            topic_models.TopicModel.get_by_name(self.TOPIC_NAME).id,
            self.TOPIC_ID
        )


class TopicCommitLogEntryModelUnitTest(test_utils.GenericTestBase):
    """Tests the TopicCommitLogEntryModel class."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            topic_models.TopicCommitLogEntryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP_IF_PUBLIC)

    def test_has_reference_to_user_id(self):
        commit = topic_models.TopicCommitLogEntryModel.create(
            'b', 0, 'committer_id', 'username', 'msg', 'create', [{}],
            constants.ACTIVITY_STATUS_PUBLIC, False)
        commit.topic_id = 'b'
        commit.put()
        self.assertTrue(
            topic_models.TopicCommitLogEntryModel
            .has_reference_to_user_id('committer_id'))
        self.assertFalse(
            topic_models.TopicCommitLogEntryModel
            .has_reference_to_user_id('x_id'))

    def test__get_instance_id(self):
        # Calling create() method calls _get_instance (a protected method)
        # and sets the instance id equal to the result of calling that method.
        topic_commit_log_entry = (
            topic_models.TopicCommitLogEntryModel.create(
                entity_id='entity_id',
                version=1,
                committer_id='committer_id',
                committer_username='committer_username',
                commit_type='create',
                commit_message='Created new TopicCommitLogEntry',
                commit_cmds=[{'cmd': 'create_new'}],
                status=constants.ACTIVITY_STATUS_PRIVATE,
                community_owned=True
            )
        )
        self.assertEqual(
            topic_commit_log_entry.id,
            'topic-entity_id-1'
        )


class TopicSummaryModelUnitTests(test_utils.GenericTestBase):
    """Tests the TopicSummaryModel class."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            topic_models.TopicSummaryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP_IF_PUBLIC)

    def test_has_reference_to_user_id(self):
        self.assertFalse(
            topic_models.TopicSummaryModel.has_reference_to_user_id('any_id'))

    def test_get_user_id_migration_policy(self):
        self.assertEqual(
            topic_models.TopicSummaryModel.get_user_id_migration_policy(),
            base_models.USER_ID_MIGRATION_POLICY.NOT_APPLICABLE)


class SubtopicPageModelUnitTest(test_utils.GenericTestBase):
    """Tests the SubtopicPageModel class."""
    SUBTOPIC_PAGE_ID = 'subtopic_page_id'

    def test_get_deletion_policy(self):
        self.assertEqual(
            topic_models.SubtopicPageModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP_IF_PUBLIC)

    def test_has_reference_to_user_id(self):
        subtopic_page_model = topic_models.SubtopicPageModel(
            id='subtopic_id',
            topic_id='topic_id',
            page_contents={},
            page_contents_schema_version=1,
            language_code=constants.DEFAULT_LANGUAGE_CODE)
        subtopic_page_model.commit(
            committer_id='committer_id',
            commit_message='Created new subtopic page',
            commit_cmds=[{'cmd': subtopic_page_domain.CMD_CREATE_NEW}])
        self.assertTrue(
            topic_models.SubtopicPageModel
            .has_reference_to_user_id('committer_id'))
        self.assertFalse(
            topic_models.SubtopicPageModel.has_reference_to_user_id('x_id'))

    def test_that_subsidiary_models_are_created_when_new_model_is_saved(self):
        """Tests the _trusted_commit() method."""

        # SubtopicPage is created but not committed/saved.
        subtopic_page = topic_models.SubtopicPageModel(
            id=self.SUBTOPIC_PAGE_ID,
            topic_id='topic_id',
            page_contents={},
            page_contents_schema_version=(
                feconf.CURRENT_SUBTOPIC_PAGE_CONTENTS_SCHEMA_VERSION),
            language_code='en'
        )
        # We check that subtopic page has not been saved before calling
        # commit().
        self.assertIsNone(
            topic_models.SubtopicPageModel.get(
                entity_id=self.SUBTOPIC_PAGE_ID,
                strict=False
            )
        )
        # We call commit() expecting that _trusted_commit works fine
        # and saves subtopic page to datastore.
        subtopic_page.commit(
            committer_id=feconf.SYSTEM_COMMITTER_ID,
            commit_message='Created new topic',
            commit_cmds=[{'cmd': topic_domain.CMD_CREATE_NEW}]
        )
        # Now we check that subtopic page is not None and that actually
        # now subtopic page exists, that means that commit() worked fine.
        self.assertIsNotNone(
            topic_models.SubtopicPageModel.get(
                entity_id=self.SUBTOPIC_PAGE_ID,
                strict=False
            )
        )


class SubtopicPageCommitLogEntryModelUnitTest(test_utils.GenericTestBase):
    """Tests the SubtopicPageCommitLogEntryModel class."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            topic_models.SubtopicPageCommitLogEntryModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP_IF_PUBLIC)

    def test_has_reference_to_user_id(self):
        commit = topic_models.SubtopicPageCommitLogEntryModel.create(
            'b', 0, 'committer_id', 'username', 'msg', 'create', [{}],
            constants.ACTIVITY_STATUS_PUBLIC, False)
        commit.subtopic_page_id = 'b'
        commit.put()
        self.assertTrue(
            topic_models.SubtopicPageCommitLogEntryModel
            .has_reference_to_user_id('committer_id'))
        self.assertFalse(
            topic_models.SubtopicPageCommitLogEntryModel
            .has_reference_to_user_id('x_id'))

    def test__get_instance_id(self):
        # Calling create() method calls _get_instance (a protected method)
        # and sets the instance id equal to the result of calling that method.
        subtopic_page_commit_log_entry = (
            topic_models.SubtopicPageCommitLogEntryModel.create(
                entity_id='entity_id',
                version=1,
                committer_id='committer_id',
                committer_username='committer_username',
                commit_type='create',
                commit_message='Created new SubtopicPageCommitLogEntry',
                commit_cmds=[{'cmd': 'create_new'}],
                status=constants.ACTIVITY_STATUS_PRIVATE,
                community_owned=True
            )
        )
        self.assertEqual(
            subtopic_page_commit_log_entry.id,
            'subtopicpage-entity_id-1'
        )


class TopicRightsModelUnitTests(test_utils.GenericTestBase):
    """Tests the TopicRightsModel class."""

    TOPIC_1_ID = 'topic_1_id'
    TOPIC_2_ID = 'topic_2_id'
    TOPIC_3_ID = 'topic_3_id'
    TOPIC_4_ID = 'topic_4_id'
    TOPIC_5_ID = 'topic_5_id'
    MANAGER_1_ID_OLD = 'manager_1_id_old'
    MANAGER_1_ID_NEW = 'manager_1_id_new'
    MANAGER_2_ID_OLD = 'manager_2_id_old'
    MANAGER_2_ID_NEW = 'manager_2_id_new'
    MANAGER_3_ID_OLD = 'manager_3_id_old'
    MANAGER_3_ID_NEW = 'manager_3_id_old'
    USER_ID_1 = 'user_id_1'
    USER_ID_2 = 'user_id_2'

    def setUp(self):
        super(TopicRightsModelUnitTests, self).setUp()
        topic_models.TopicRightsModel(
            id=self.TOPIC_4_ID,
            manager_ids=[self.USER_ID_2],
            topic_is_published=True
        ).commit(
            'commiter_id',
            'New topic rights',
            [{'cmd': topic_domain.CMD_CREATE_NEW}])
        topic_models.TopicRightsModel(
            id=self.TOPIC_5_ID,
            manager_ids=[self.USER_ID_2],
            topic_is_published=True
        ).commit(
            'commiter_id',
            'New topic rights',
            [{'cmd': topic_domain.CMD_CREATE_NEW}])

    def test_get_deletion_policy(self):
        self.assertEqual(
            topic_models.TopicRightsModel.get_deletion_policy(),
            base_models.DELETION_POLICY.KEEP_IF_PUBLIC)

    def test_has_reference_to_user_id(self):
        with self.swap(base_models, 'FETCH_BATCH_SIZE', 1):
            topic_rights = topic_models.TopicRightsModel(
                id=self.TOPIC_1_ID, manager_ids=['manager_id'])
            topic_rights.commit(
                'committer_id',
                'New topic rights',
                [{'cmd': topic_domain.CMD_CREATE_NEW}])
            self.assertTrue(
                topic_models.TopicRightsModel
                .has_reference_to_user_id('manager_id'))
            self.assertTrue(
                topic_models.TopicRightsModel
                .has_reference_to_user_id('committer_id'))
            self.assertFalse(
                topic_models.TopicRightsModel.has_reference_to_user_id('x_id'))

            # We remove the manager_id form manager_ids to to verify that the
            # manager_id is still found in TopicRightsSnapshotContentModel.
            topic_rights = topic_models.TopicRightsModel.get_by_id(
                self.TOPIC_1_ID)
            topic_rights.manager_ids = ['different_manager_id']
            topic_rights.commit(
                'committer_id',
                'Change topic rights',
                [{'cmd': topic_domain.CMD_CREATE_NEW}])

            self.assertTrue(
                topic_models.TopicRightsModel
                .has_reference_to_user_id('manager_id'))
            self.assertTrue(
                topic_models.TopicRightsModel
                .has_reference_to_user_id('different_manager_id'))

    def test_get_user_id_migration_policy(self):
        self.assertEqual(
            topic_models.TopicRightsModel.get_user_id_migration_policy(),
            base_models.USER_ID_MIGRATION_POLICY.CUSTOM)

    def test_migrate_model(self):
        original_model_1 = topic_models.TopicRightsModel(
            id=self.TOPIC_1_ID, manager_ids=[self.MANAGER_1_ID_OLD])
        original_model_1.commit(
            'committer_id',
            'New topic rights',
            [{'cmd': topic_domain.CMD_CREATE_NEW}])
        original_model_2 = topic_models.TopicRightsModel(
            id=self.TOPIC_2_ID,
            manager_ids=[self.MANAGER_1_ID_OLD, self.MANAGER_2_ID_OLD])
        original_model_2.commit(
            'committer_id',
            'New topic rights',
            [{'cmd': topic_domain.CMD_CREATE_NEW}])
        original_model_3 = topic_models.TopicRightsModel(
            id=self.TOPIC_3_ID,
            manager_ids=[self.MANAGER_2_ID_OLD, self.MANAGER_3_ID_OLD])
        original_model_3.commit(
            'committer_id',
            'New topic rights',
            [{'cmd': topic_domain.CMD_CREATE_NEW}])

        topic_models.TopicRightsModel.migrate_model(
            self.MANAGER_1_ID_OLD, self.MANAGER_1_ID_NEW)
        topic_models.TopicRightsModel.migrate_model(
            self.MANAGER_2_ID_OLD, self.MANAGER_2_ID_NEW)
        topic_models.TopicRightsModel.migrate_model(
            self.MANAGER_3_ID_OLD, self.MANAGER_3_ID_NEW)

        migrated_model_1 = topic_models.TopicRightsModel.get_by_id(
            self.TOPIC_1_ID)
        self.assertEqual([self.MANAGER_1_ID_NEW], migrated_model_1.manager_ids)
        migrated_model_2 = topic_models.TopicRightsModel.get_by_id(
            self.TOPIC_2_ID)
        self.assertEqual(
            [self.MANAGER_1_ID_NEW, self.MANAGER_2_ID_NEW],
            migrated_model_2.manager_ids)
        migrated_model_3 = topic_models.TopicRightsModel.get_by_id(
            self.TOPIC_3_ID)
        self.assertEqual(
            [self.MANAGER_2_ID_NEW, self.MANAGER_3_ID_NEW],
            migrated_model_3.manager_ids)

    def test_verify_model_user_ids_exist(self):
        user_models.UserSettingsModel(
            id=self.MANAGER_1_ID_NEW,
            gae_id='gae_1_id',
            email='some@email.com',
            role=feconf.ROLE_ID_COLLECTION_EDITOR
        ).put()
        user_models.UserSettingsModel(
            id=self.MANAGER_2_ID_NEW,
            gae_id='gae_2_id',
            email='some_other@email.com',
            role=feconf.ROLE_ID_COLLECTION_EDITOR
        ).put()
        model = topic_models.TopicRightsModel(
            id=self.TOPIC_1_ID,
            manager_ids=[self.MANAGER_1_ID_NEW, self.MANAGER_2_ID_NEW])
        self.assertTrue(model.verify_model_user_ids_exist())

        model.manager_ids = [feconf.SYSTEM_COMMITTER_ID]
        self.assertTrue(model.verify_model_user_ids_exist())
        model.manager_ids = [feconf.MIGRATION_BOT_USER_ID]
        self.assertTrue(model.verify_model_user_ids_exist())
        model.manager_ids = [feconf.SUGGESTION_BOT_USER_ID]
        self.assertTrue(model.verify_model_user_ids_exist())

        model.manager_ids = [self.MANAGER_1_ID_NEW, 'user_non_id']
        self.assertFalse(model.verify_model_user_ids_exist())

        model.manager_ids = ['user_non_id']
        self.assertFalse(model.verify_model_user_ids_exist())

    def test_export_data_nontrivial(self):
        """Tests nontrivial export data on user with some managed topics."""
        user_data = topic_models.TopicRightsModel.export_data(self.USER_ID_2)
        expected_data = {
            'managed_topic_ids': [self.TOPIC_4_ID, self.TOPIC_5_ID]
        }
        self.assertEqual(user_data, expected_data)

    def test_export_data_trivial(self):
        """Tests trivial export data on user with no managed topics."""
        user_data = topic_models.TopicRightsModel.export_data(self.USER_ID_1)
        expected_data = {
            'managed_topic_ids': []
        }
        self.assertEqual(user_data, expected_data)
