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

"""Unit tests for core.domain.collection_validators."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from constants import constants
from core.domain import collection_domain
from core.domain import collection_services
from core.domain import exp_domain
from core.domain import exp_services
from core.domain import prod_validation_jobs_one_off
from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf
import python_utils


datastore_services = models.Registry.import_datastore_services()

USER_EMAIL = 'useremail@example.com'
USER_NAME = 'username'

(collection_models, exp_models, user_models) = models.Registry.import_models([
    models.NAMES.collection, models.NAMES.exploration, models.NAMES.user])


class CollectionModelValidatorTests(test_utils.AuditJobsTestBase):
    def setUp(self):
        super(CollectionModelValidatorTests, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i
        ) for i in python_utils.RANGE(6)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        language_codes = ['ar', 'en', 'en']

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
            objective='objective%d' % i,
            language_code=language_codes[i]
        ) for i in python_utils.RANGE(3)]

        for index, collection in enumerate(collections):
            collection.add_node('%s' % (index * 2))
            collection.add_node('%s' % (index * 2 + 1))
            collection_services.save_new_collection(self.owner_id, collection)

        self.model_instance_0 = collection_models.CollectionModel.get_by_id('0')
        self.model_instance_1 = collection_models.CollectionModel.get_by_id('1')
        self.model_instance_2 = collection_models.CollectionModel.get_by_id('2')

        self.job_class = (
            prod_validation_jobs_one_off.CollectionModelAuditOneOffJob)

    def test_standard_operation(self):
        collection_services.update_collection(
            self.owner_id, '0', [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': 'New title'
            }], 'Changes.')

        expected_output = [
            u'[u\'fully-validated CollectionModel\', 3]']
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
                'of CollectionModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance_0.id,
                    self.model_instance_0.created_on,
                    self.model_instance_0.last_updated
                ),
            u'[u\'fully-validated CollectionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.model_instance_2.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [
            '[u\'fully-validated CollectionModel\', 2]',
            (
                u'[u\'failed validation check for current time check of '
                'CollectionModel\', '
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

    def test_model_with_invalid_collection_schema(self):
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'CollectionModel\', '
                '[u\'Entity id %s: Entity fails domain validation with the '
                'error Invalid language code: %s\']]'
            ) % (self.model_instance_0.id, self.model_instance_0.language_code),
            u'[u\'fully-validated CollectionModel\', 2]']
        with self.swap(
            constants, 'SUPPORTED_CONTENT_LANGUAGES', [{
                'code': 'en', 'description': 'English'}]):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_private_collection_with_missing_title(self):
        collection_services.update_collection(
            self.owner_id, '0', [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': ''
            }], 'Changes.')
        expected_output = [
            u'[u\'fully-validated CollectionModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_public_collection_with_missing_title(self):
        collection_services.update_collection(
            self.owner_id, '0', [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': ''
            }], 'Changes.')
        owner = user_services.get_user_actions_info(self.owner_id)
        rights_manager.publish_collection(owner, '0')
        expected_output = [
            (
                u'[u\'failed validation check for domain object check of '
                'CollectionModel\', [u\'Entity id 0: Entity fails '
                'domain validation with the error A title must be specified '
                'for the collection.\']]'
            ),
            u'[u\'fully-validated CollectionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_exploration_model_failure(self):
        exp_models.ExplorationModel.get_by_id('1').delete(
            self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for '
                'exploration_ids field check of CollectionModel\', '
                '[u"Entity id 0: based on field exploration_ids having value '
                '1, expected model ExplorationModel '
                'with id 1 but it doesn\'t exist"]]'
            ),
            u'[u\'fully-validated CollectionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_collection_commit_log_entry_model_failure(self):
        collection_services.update_collection(
            self.owner_id, '0', [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': 'New title'
            }], 'Changes.')
        collection_models.CollectionCommitLogEntryModel.get_by_id(
            'collection-0-1').delete()

        expected_output = [
            (
                u'[u\'failed validation check for '
                'collection_commit_log_entry_ids field check of '
                'CollectionModel\', '
                '[u"Entity id 0: based on field '
                'collection_commit_log_entry_ids having value '
                'collection-0-1, expected model CollectionCommitLogEntryModel '
                'with id collection-0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated CollectionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_summary_model_failure(self):
        collection_models.CollectionSummaryModel.get_by_id('0').delete()

        expected_output = [
            (
                u'[u\'failed validation check for collection_summary_ids '
                'field check of CollectionModel\', '
                '[u"Entity id 0: based on field collection_summary_ids '
                'having value 0, expected model CollectionSummaryModel with '
                'id 0 but it doesn\'t exist"]]'),
            u'[u\'fully-validated CollectionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_collection_rights_model_failure(self):
        collection_models.CollectionRightsModel.get_by_id(
            '0').delete(feconf.SYSTEM_COMMITTER_ID, '', [])

        expected_output = [
            (
                u'[u\'failed validation check for collection_rights_ids '
                'field check of CollectionModel\', '
                '[u"Entity id 0: based on field collection_rights_ids having '
                'value 0, expected model CollectionRightsModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated CollectionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_metadata_model_failure(self):
        collection_models.CollectionSnapshotMetadataModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of CollectionModel\', '
                '[u"Entity id 0: based on field snapshot_metadata_ids having '
                'value 0-1, expected model CollectionSnapshotMetadataModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated CollectionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_content_model_failure(self):
        collection_models.CollectionSnapshotContentModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of CollectionModel\', '
                '[u"Entity id 0: based on field snapshot_content_ids having '
                'value 0-1, expected model CollectionSnapshotContentModel '
                'with id 0-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated CollectionModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class CollectionSnapshotMetadataModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(CollectionSnapshotMetadataModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(6)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
            objective='objective%d' % i,
        ) for i in python_utils.RANGE(3)]

        for index, collection in enumerate(collections):
            collection.add_node('%s' % (index * 2))
            collection.add_node('%s' % (index * 2 + 1))
            if collection.id != '0':
                collection_services.save_new_collection(
                    self.owner_id, collection)
            else:
                collection_services.save_new_collection(
                    self.user_id, collection)

        self.model_instance_0 = (
            collection_models.CollectionSnapshotMetadataModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            collection_models.CollectionSnapshotMetadataModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            collection_models.CollectionSnapshotMetadataModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .CollectionSnapshotMetadataModelAuditOneOffJob)

    def test_standard_operation(self):
        collection_services.update_collection(
            self.owner_id, '0', [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': 'New title'
            }], 'Changes.')
        expected_output = [
            u'[u\'fully-validated CollectionSnapshotMetadataModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_committer_id_migration_bot(self):
        self.model_instance_1.committer_id = feconf.MIGRATION_BOT_USER_ID
        self.model_instance_1.update_timestamps(update_last_updated_time=False)
        self.model_instance_1.put()

        expected_output = [
            u'[u\'fully-validated CollectionSnapshotMetadataModel\', 3]'
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_pseudo_committer_id(self):
        self.model_instance_1.committer_id = self.PSEUDONYMOUS_ID
        self.model_instance_1.update_timestamps(update_last_updated_time=False)
        self.model_instance_1.put()

        expected_output = [
            u'[u\'fully-validated CollectionSnapshotMetadataModel\', 3]'
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
            'of CollectionSnapshotMetadataModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'CollectionSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CollectionSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionModel.get_by_id('0').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_ids '
                'field check of CollectionSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field collection_ids '
                'having value 0, expected model CollectionModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'collection_ids having value 0, expected model '
                'CollectionModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'CollectionSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of CollectionSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field committer_ids having '
                'value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'CollectionSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_collection_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            collection_models.CollectionSnapshotMetadataModel(
                id='0-3', committer_id=self.owner_id, commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for collection model '
                'version check of CollectionSnapshotMetadataModel\', '
                '[u\'Entity id 0-3: Collection model corresponding to '
                'id 0 has a version 1 which is less than the version 3 in '
                'snapshot metadata model id\']]'
            ), (
                u'[u\'fully-validated CollectionSnapshotMetadataModel\', '
                '3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'add_collection_node',
        }, {
            'cmd': 'delete_collection_node',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'delete_collection_node check of '
                'CollectionSnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'delete_collection_node\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with error: '
                'The following required attributes are missing: '
                'exploration_id, The following extra attributes '
                'are present: invalid_attribute"]]'
            ), (
                u'[u\'failed validation check for commit cmd '
                'add_collection_node check of '
                'CollectionSnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'add_collection_node\'} failed '
                'with error: The following required attributes are '
                'missing: exploration_id"]]'
            ), u'[u\'fully-validated CollectionSnapshotMetadataModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class CollectionSnapshotContentModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(CollectionSnapshotContentModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(6)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
            objective='objective%d' % i,
        ) for i in python_utils.RANGE(3)]

        for index, collection in enumerate(collections):
            collection.add_node('%s' % (index * 2))
            collection.add_node('%s' % (index * 2 + 1))
            collection_services.save_new_collection(self.owner_id, collection)

        self.model_instance_0 = (
            collection_models.CollectionSnapshotContentModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            collection_models.CollectionSnapshotContentModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            collection_models.CollectionSnapshotContentModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .CollectionSnapshotContentModelAuditOneOffJob)

    def test_standard_operation(self):
        collection_services.update_collection(
            self.owner_id, '0', [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': 'New title'
            }], 'Changes.')
        expected_output = [
            u'[u\'fully-validated CollectionSnapshotContentModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of CollectionSnapshotContentModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'CollectionSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CollectionSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionModel.get_by_id('0').delete(
            self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_ids '
                'field check of CollectionSnapshotContentModel\', '
                '[u"Entity id 0-1: based on field collection_ids '
                'having value 0, expected model CollectionModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'collection_ids having value 0, expected model '
                'CollectionModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'CollectionSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_collection_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            collection_models.CollectionSnapshotContentModel(
                id='0-3'))
        model_with_invalid_version_in_id.content = {}
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for collection model '
                'version check of CollectionSnapshotContentModel\', '
                '[u\'Entity id 0-3: Collection model corresponding to '
                'id 0 has a version 1 which is less than '
                'the version 3 in snapshot content model id\']]'
            ), (
                u'[u\'fully-validated CollectionSnapshotContentModel\', '
                '3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class CollectionRightsModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(CollectionRightsModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)

        editor_email = 'user@editor.com'
        viewer_email = 'user@viewer.com'

        self.signup(editor_email, 'editor')
        self.signup(viewer_email, 'viewer')

        self.editor_id = self.get_user_id_from_email(editor_email)
        self.viewer_id = self.get_user_id_from_email(viewer_email)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(6)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
            objective='objective%d' % i,
        ) for i in python_utils.RANGE(3)]

        for index, collection in enumerate(collections):
            collection.add_node('%s' % (index * 2))
            collection.add_node('%s' % (index * 2 + 1))
            collection_services.save_new_collection(self.owner_id, collection)

        rights_manager.assign_role_for_collection(
            self.owner, '0', self.editor_id, rights_domain.ROLE_EDITOR)

        rights_manager.assign_role_for_collection(
            self.owner, '2', self.viewer_id, rights_domain.ROLE_VIEWER)

        self.model_instance_0 = (
            collection_models.CollectionRightsModel.get_by_id('0'))
        self.model_instance_1 = (
            collection_models.CollectionRightsModel.get_by_id('1'))
        self.model_instance_2 = (
            collection_models.CollectionRightsModel.get_by_id('2'))

        self.job_class = (
            prod_validation_jobs_one_off.CollectionRightsModelAuditOneOffJob)

    def test_standard_operation(self):
        rights_manager.publish_collection(self.owner, '0')
        expected_output = [
            u'[u\'fully-validated CollectionRightsModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.commit(
            feconf.SYSTEM_COMMITTER_ID, 'created_on test', [])
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of CollectionRightsModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated CollectionRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        self.model_instance_2.delete(feconf.SYSTEM_COMMITTER_ID, 'delete')
        expected_output = [
            '[u\'fully-validated CollectionRightsModel\', 2]',
            (
                u'[u\'failed validation check for current time check of '
                'CollectionRightsModel\', '
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

    def test_model_with_first_published_datetime_greater_than_current_time(
            self):
        rights_manager.publish_collection(self.owner, '0')
        rights_manager.publish_collection(self.owner, '1')
        self.model_instance_0.first_published_msec = (
            self.model_instance_0.first_published_msec * 1000000.0)
        self.model_instance_0.commit(feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for first published msec check '
                'of CollectionRightsModel\', '
                '[u\'Entity id 0: The first_published_msec field has a '
                'value %s which is greater than the time when the job was '
                'run\']]'
            ) % (self.model_instance_0.first_published_msec),
            u'[u\'fully-validated CollectionRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_ids '
                'field check of CollectionRightsModel\', '
                '[u"Entity id 0: based on field collection_ids having '
                'value 0, expected model CollectionModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated CollectionRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_owner_user_model_failure(self):
        rights_manager.assign_role_for_collection(
            self.owner, '0', self.user_id, rights_domain.ROLE_OWNER)
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for owner_user_ids '
                'field check of CollectionRightsModel\', '
                '[u"Entity id 0: based on field owner_user_ids having '
                'value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]') % (self.user_id, self.user_id),
            u'[u\'fully-validated CollectionRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_editor_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.editor_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for editor_user_ids '
                'field check of CollectionRightsModel\', '
                '[u"Entity id 0: based on field editor_user_ids having '
                'value %s, expected model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.editor_id, self.editor_id),
            u'[u\'fully-validated CollectionRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_viewer_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.viewer_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for viewer_user_ids '
                'field check of CollectionRightsModel\', '
                '[u"Entity id 2: based on field viewer_user_ids having '
                'value %s, expected model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.viewer_id, self.viewer_id),
            u'[u\'fully-validated CollectionRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_metadata_model_failure(self):
        collection_models.CollectionRightsSnapshotMetadataModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of CollectionRightsModel\', '
                '[u"Entity id 0: based on field snapshot_metadata_ids having '
                'value 0-1, expected model '
                'CollectionRightsSnapshotMetadataModel '
                'with id 0-1 but it doesn\'t exist"]]'
            ),
            u'[u\'fully-validated CollectionRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_content_model_failure(self):
        collection_models.CollectionRightsSnapshotContentModel.get_by_id(
            '0-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of CollectionRightsModel\', '
                '[u"Entity id 0: based on field snapshot_content_ids having '
                'value 0-1, expected model '
                'CollectionRightsSnapshotContentModel with id 0-1 but it '
                'doesn\'t exist"]]'),
            u'[u\'fully-validated CollectionRightsModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class CollectionRightsSnapshotMetadataModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(CollectionRightsSnapshotMetadataModelValidatorTests, self).setUp(
            )

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.user_id = self.get_user_id_from_email(USER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(6)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
            objective='objective%d' % i,
        ) for i in python_utils.RANGE(3)]

        for index, collection in enumerate(collections):
            collection.add_node('%s' % (index * 2))
            collection.add_node('%s' % (index * 2 + 1))
            if collection.id != '0':
                collection_services.save_new_collection(
                    self.owner_id, collection)
            else:
                collection_services.save_new_collection(
                    self.user_id, collection)

        self.model_instance_0 = (
            collection_models.CollectionRightsSnapshotMetadataModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            collection_models.CollectionRightsSnapshotMetadataModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            collection_models.CollectionRightsSnapshotMetadataModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .CollectionRightsSnapshotMetadataModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated CollectionRightsSnapshotMetadataModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_committer_id_migration_bot(self):
        self.model_instance_1.committer_id = feconf.MIGRATION_BOT_USER_ID
        self.model_instance_1.update_timestamps(update_last_updated_time=False)
        self.model_instance_1.put()

        expected_output = [
            u'[u\'fully-validated CollectionRightsSnapshotMetadataModel\', 3]'
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_pseudo_committer_id(self):
        self.model_instance_1.committer_id = self.PSEUDONYMOUS_ID
        self.model_instance_1.update_timestamps(update_last_updated_time=False)
        self.model_instance_1.put()

        expected_output = [
            u'[u\'fully-validated CollectionRightsSnapshotMetadataModel\', 3]'
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
            'of CollectionRightsSnapshotMetadataModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'CollectionRightsSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CollectionRightsSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_collection_rights_model_failure(self):
        collection_models.CollectionRightsModel.get_by_id('0').delete(
            self.user_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_rights_ids '
                'field check of CollectionRightsSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field collection_rights_ids '
                'having value 0, expected model CollectionRightsModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'collection_rights_ids having value 0, expected model '
                'CollectionRightsModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'CollectionRightsSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of CollectionRightsSnapshotMetadataModel\', '
                '[u"Entity id 0-1: based on field committer_ids having '
                'value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.user_id, self.user_id), (
                u'[u\'fully-validated '
                'CollectionRightsSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_collection_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            collection_models.CollectionRightsSnapshotMetadataModel(
                id='0-3', committer_id=self.owner_id, commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for collection rights model '
                'version check of CollectionRightsSnapshotMetadataModel\', '
                '[u\'Entity id 0-3: CollectionRights model corresponding to '
                'id 0 has a version 1 which is less than the version 3 in '
                'snapshot metadata model id\']]'
            ), (
                u'[u\'fully-validated '
                'CollectionRightsSnapshotMetadataModel\', 3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'change_collection_status',
            'old_status': rights_domain.ACTIVITY_STATUS_PUBLIC,
        }, {
            'cmd': 'release_ownership',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'change_collection_status check of '
                'CollectionRightsSnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation for '
                'command: {u\'old_status\': u\'public\', '
                'u\'cmd\': u\'change_collection_status\'} failed with error: '
                'The following required attributes are missing: '
                'new_status"]]'
            ), (
                u'[u\'failed validation check for commit cmd '
                'release_ownership check of '
                'CollectionRightsSnapshotMetadataModel\', '
                '[u"Entity id 0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'release_ownership\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with error: '
                'The following extra attributes are present: '
                'invalid_attribute"]]'
            ), (
                u'[u\'fully-validated '
                'CollectionRightsSnapshotMetadataModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class CollectionRightsSnapshotContentModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(CollectionRightsSnapshotContentModelValidatorTests, self).setUp(
            )

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(6)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
            objective='objective%d' % i,
        ) for i in python_utils.RANGE(3)]

        for index, collection in enumerate(collections):
            collection.add_node('%s' % (index * 2))
            collection.add_node('%s' % (index * 2 + 1))
            collection_services.save_new_collection(self.owner_id, collection)

        self.model_instance_0 = (
            collection_models.CollectionRightsSnapshotContentModel.get_by_id(
                '0-1'))
        self.model_instance_1 = (
            collection_models.CollectionRightsSnapshotContentModel.get_by_id(
                '1-1'))
        self.model_instance_2 = (
            collection_models.CollectionRightsSnapshotContentModel.get_by_id(
                '2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .CollectionRightsSnapshotContentModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated CollectionRightsSnapshotContentModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of CollectionRightsSnapshotContentModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), (
                u'[u\'fully-validated '
                'CollectionRightsSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CollectionRightsSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionRightsModel.get_by_id('0').delete(
            self.owner_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_rights_ids '
                'field check of CollectionRightsSnapshotContentModel\', '
                '[u"Entity id 0-1: based on field collection_rights_ids '
                'having value 0, expected model CollectionRightsModel with '
                'id 0 but it doesn\'t exist", u"Entity id 0-2: based on field '
                'collection_rights_ids having value 0, expected model '
                'CollectionRightsModel with id 0 but it doesn\'t exist"]]'
            ), (
                u'[u\'fully-validated '
                'CollectionRightsSnapshotContentModel\', 2]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_collection_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            collection_models.CollectionRightsSnapshotContentModel(
                id='0-3'))
        model_with_invalid_version_in_id.content = {}
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for collection rights model '
                'version check of CollectionRightsSnapshotContentModel\', '
                '[u\'Entity id 0-3: CollectionRights model corresponding to '
                'id 0 has a version 1 which is less than the version 3 in '
                'snapshot content model id\']]'
            ), (
                u'[u\'fully-validated CollectionRightsSnapshotContentModel\', '
                '3]')]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class CollectionCommitLogEntryModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(CollectionCommitLogEntryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(6)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
            objective='objective%d' % i,
        ) for i in python_utils.RANGE(3)]

        for index, collection in enumerate(collections):
            collection.add_node('%s' % (index * 2))
            collection.add_node('%s' % (index * 2 + 1))
            collection_services.save_new_collection(self.owner_id, collection)

        self.rights_model_instance = (
            collection_models.CollectionCommitLogEntryModel(
                id='rights-1-1',
                user_id=self.owner_id,
                collection_id='1',
                commit_type='edit',
                commit_message='',
                commit_cmds=[],
                post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
                post_commit_community_owned=False,
                post_commit_is_private=False))
        self.rights_model_instance.update_timestamps()
        self.rights_model_instance.put()

        self.model_instance_0 = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'collection-0-1'))
        self.model_instance_1 = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'collection-1-1'))
        self.model_instance_2 = (
            collection_models.CollectionCommitLogEntryModel.get_by_id(
                'collection-2-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .CollectionCommitLogEntryModelAuditOneOffJob)

    def test_standard_operation(self):
        collection_services.update_collection(
            self.owner_id, '0', [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': 'New title'
            }], 'Changes.')
        expected_output = [
            u'[u\'fully-validated CollectionCommitLogEntryModel\', 5]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_user_id_migration_bot(self):
        self.model_instance_1.user_id = feconf.MIGRATION_BOT_USER_ID
        self.model_instance_1.update_timestamps(update_last_updated_time=False)
        self.model_instance_1.put()

        expected_output = [
            u'[u\'fully-validated CollectionCommitLogEntryModel\', 4]'
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_pseudo_user_id(self):
        self.model_instance_1.user_id = self.PSEUDONYMOUS_ID
        self.model_instance_1.update_timestamps(update_last_updated_time=False)
        self.model_instance_1.put()

        expected_output = [
            u'[u\'fully-validated CollectionCommitLogEntryModel\', 4]'
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
            'of CollectionCommitLogEntryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated CollectionCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.model_instance_1.delete()
        self.model_instance_2.delete()
        self.rights_model_instance.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CollectionCommitLogEntryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_collection_model_failure(self):
        collection_models.CollectionModel.get_by_id('0').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_ids '
                'field check of CollectionCommitLogEntryModel\', '
                '[u"Entity id collection-0-1: based on field collection_ids '
                'having value 0, expected model CollectionModel with id 0 '
                'but it doesn\'t exist", u"Entity id collection-0-2: based '
                'on field collection_ids having value 0, expected model '
                'CollectionModel with id 0 but it doesn\'t exist"]]'
            ), u'[u\'fully-validated CollectionCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, literal_eval=True)

    def test_missing_collection_rights_model_failure(self):
        collection_models.CollectionRightsModel.get_by_id('1').delete(
            feconf.SYSTEM_COMMITTER_ID, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for collection_rights_ids '
                'field check of CollectionCommitLogEntryModel\', '
                '[u"Entity id rights-1-1: based on field '
                'collection_rights_ids having value 1, expected model '
                'CollectionRightsModel with id 1 but it doesn\'t exist"]]'
            ), u'[u\'fully-validated CollectionCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True)

    def test_invalid_collection_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            collection_models.CollectionCommitLogEntryModel.create(
                '0', 3, self.owner_id, 'edit', 'msg', [{}],
                constants.ACTIVITY_STATUS_PUBLIC, False))
        model_with_invalid_version_in_id.collection_id = '0'
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for collection model '
                'version check of CollectionCommitLogEntryModel\', '
                '[u\'Entity id %s: Collection model corresponding '
                'to id 0 has a version 1 which is less than '
                'the version 3 in commit log entry model id\']]'
            ) % (model_with_invalid_version_in_id.id),
            u'[u\'fully-validated CollectionCommitLogEntryModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_id(self):
        model_with_invalid_id = (
            collection_models.CollectionCommitLogEntryModel(
                id='invalid-0-1',
                user_id=self.owner_id,
                commit_type='edit',
                commit_message='msg',
                commit_cmds=[{}],
                post_commit_status=constants.ACTIVITY_STATUS_PUBLIC,
                post_commit_is_private=False))
        model_with_invalid_id.collection_id = '0'
        model_with_invalid_id.update_timestamps()
        model_with_invalid_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for model id check of '
                'CollectionCommitLogEntryModel\', '
                '[u\'Entity id %s: Entity id does not match regex pattern\']]'
            ) % (model_with_invalid_id.id), (
                u'[u\'failed validation check for commit cmd check of '
                'CollectionCommitLogEntryModel\', [u\'Entity id invalid-0-1: '
                'No commit command domain object defined for entity with '
                'commands: [{}]\']]'),
            u'[u\'fully-validated CollectionCommitLogEntryModel\', 4]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_type(self):
        self.model_instance_0.commit_type = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit type check of '
                'CollectionCommitLogEntryModel\', '
                '[u\'Entity id collection-0-1: Commit type invalid is '
                'not allowed\']]'
            ), u'[u\'fully-validated CollectionCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_post_commit_status(self):
        self.model_instance_0.post_commit_status = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for post commit status check '
                'of CollectionCommitLogEntryModel\', '
                '[u\'Entity id collection-0-1: Post commit status invalid '
                'is invalid\']]'
            ), u'[u\'fully-validated CollectionCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_true_post_commit_is_private(self):
        self.model_instance_0.post_commit_status = (
            feconf.POST_COMMIT_STATUS_PUBLIC)
        self.model_instance_0.post_commit_is_private = True
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()

        expected_output = [
            (
                u'[u\'failed validation check for post commit is private '
                'check of CollectionCommitLogEntryModel\', '
                '[u\'Entity id %s: Post commit status is '
                '%s but post_commit_is_private is True\']]'
            ) % (self.model_instance_0.id, feconf.POST_COMMIT_STATUS_PUBLIC),
            u'[u\'fully-validated CollectionCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_false_post_commit_is_private(self):
        self.model_instance_0.post_commit_status = (
            feconf.POST_COMMIT_STATUS_PRIVATE)
        self.model_instance_0.post_commit_is_private = False
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()

        expected_output = [
            (
                u'[u\'failed validation check for post commit is private '
                'check of CollectionCommitLogEntryModel\', '
                '[u\'Entity id %s: Post commit status is '
                '%s but post_commit_is_private is False\']]'
            ) % (self.model_instance_0.id, feconf.POST_COMMIT_STATUS_PRIVATE),
            u'[u\'fully-validated CollectionCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance_0.commit_cmds = [{
            'cmd': 'add_collection_node'
        }, {
            'cmd': 'delete_collection_node',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'delete_collection_node check of '
                'CollectionCommitLogEntryModel\', '
                '[u"Entity id collection-0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'delete_collection_node\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with error: '
                'The following required attributes are missing: '
                'exploration_id, The following extra attributes '
                'are present: invalid_attribute"]]'
            ), (
                u'[u\'failed validation check for commit cmd '
                'add_collection_node check of CollectionCommitLogEntryModel\', '
                '[u"Entity id collection-0-1: Commit command domain validation '
                'for command: {u\'cmd\': u\'add_collection_node\'} '
                'failed with error: The following required attributes '
                'are missing: exploration_id"]]'),
            u'[u\'fully-validated CollectionCommitLogEntryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class CollectionSummaryModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(CollectionSummaryModelValidatorTests, self).setUp()

        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(USER_EMAIL, USER_NAME)

        self.user_id = self.get_user_id_from_email(USER_EMAIL)
        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)

        editor_email = 'user@editor.com'
        viewer_email = 'user@viewer.com'
        contributor_email = 'user@contributor.com'

        self.signup(editor_email, 'editor')
        self.signup(viewer_email, 'viewer')
        self.signup(contributor_email, 'contributor')

        self.editor_id = self.get_user_id_from_email(editor_email)
        self.viewer_id = self.get_user_id_from_email(viewer_email)
        self.contributor_id = self.get_user_id_from_email(contributor_email)

        explorations = [exp_domain.Exploration.create_default_exploration(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
        ) for i in python_utils.RANGE(6)]

        for exp in explorations:
            exp_services.save_new_exploration(self.owner_id, exp)

        language_codes = ['ar', 'en', 'en']
        collections = [collection_domain.Collection.create_default_collection(
            '%s' % i,
            title='title %d' % i,
            category='category%d' % i,
            objective='objective%d' % i,
            language_code=language_codes[i]
        ) for i in python_utils.RANGE(3)]

        for index, collection in enumerate(collections):
            collection.add_node('%s' % (index * 2))
            collection.add_node('%s' % (index * 2 + 1))
            collection.tags = ['math', 'art']
            collection_services.save_new_collection(self.owner_id, collection)

        rights_manager.assign_role_for_collection(
            self.owner, '0', self.editor_id, rights_domain.ROLE_EDITOR)
        collection_services.update_collection(
            self.contributor_id, '0', [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': 'New title'
            }], 'Changes.')

        rights_manager.assign_role_for_collection(
            self.owner, '2', self.viewer_id, rights_domain.ROLE_VIEWER)

        self.model_instance_0 = (
            collection_models.CollectionSummaryModel.get_by_id('0'))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()

        self.model_instance_1 = (
            collection_models.CollectionSummaryModel.get_by_id('1'))
        self.model_instance_2 = (
            collection_models.CollectionSummaryModel.get_by_id('2'))

        self.job_class = (
            prod_validation_jobs_one_off.CollectionSummaryModelAuditOneOffJob)

    def test_standard_operation(self):
        rights_manager.publish_collection(self.owner, '0')
        collection_services.update_collection(
            self.owner_id, '1', [{
                'cmd': 'edit_collection_property',
                'property_name': 'title',
                'new_value': 'New title'
            }], 'Changes.')
        expected_output = [
            u'[u\'fully-validated CollectionSummaryModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance_0.created_on = (
            self.model_instance_0.last_updated + datetime.timedelta(days=1))
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [(
            u'[u\'failed validation check for time field relation check '
            'of CollectionSummaryModel\', '
            '[u\'Entity id %s: The created_on field has a value '
            '%s which is greater than the value '
            '%s of last_updated field\']]') % (
                self.model_instance_0.id,
                self.model_instance_0.created_on,
                self.model_instance_0.last_updated
            ), u'[u\'fully-validated CollectionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        collection_services.delete_collection(self.owner_id, '1')
        collection_services.delete_collection(self.owner_id, '2')
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'CollectionSummaryModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance_0.id, self.model_instance_0.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_collection_model_failure(self):
        collection_model = collection_models.CollectionModel.get_by_id('0')
        collection_model.delete(feconf.SYSTEM_COMMITTER_ID, '', [])
        self.model_instance_0.collection_model_last_updated = (
            collection_model.last_updated)
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for collection_ids '
                'field check of CollectionSummaryModel\', '
                '[u"Entity id 0: based on field collection_ids having '
                'value 0, expected model CollectionModel with id 0 but '
                'it doesn\'t exist"]]'),
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_owner_user_model_failure(self):
        rights_manager.assign_role_for_collection(
            self.owner, '0', self.user_id, rights_domain.ROLE_OWNER)
        user_models.UserSettingsModel.get_by_id(self.user_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for owner_user_ids '
                'field check of CollectionSummaryModel\', '
                '[u"Entity id 0: based on field owner_user_ids having '
                'value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]') % (self.user_id, self.user_id),
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_editor_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.editor_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for editor_user_ids '
                'field check of CollectionSummaryModel\', '
                '[u"Entity id 0: based on field editor_user_ids having '
                'value %s, expected model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.editor_id, self.editor_id),
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_viewer_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.viewer_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for viewer_user_ids '
                'field check of CollectionSummaryModel\', '
                '[u"Entity id 2: based on field viewer_user_ids having '
                'value %s, expected model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.viewer_id, self.viewer_id),
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_contributor_user_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.contributor_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for contributor_user_ids '
                'field check of CollectionSummaryModel\', '
                '[u"Entity id 0: based on field contributor_user_ids having '
                'value %s, expected model UserSettingsModel with id %s but '
                'it doesn\'t exist"]]') % (
                    self.contributor_id, self.contributor_id),
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_contributors_summary(self):
        sorted_contributor_ids = sorted(
            self.model_instance_0.contributors_summary.keys())
        self.model_instance_0.contributors_summary = {'invalid': 1}
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for contributors summary '
                'check of CollectionSummaryModel\', '
                '[u"Entity id 0: Contributor ids: [u\'%s\', u\'%s\'] do '
                'not match the contributor ids obtained using '
                'contributors summary: [u\'invalid\']"]]'
            ) % (sorted_contributor_ids[0], sorted_contributor_ids[1]),
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_node_count(self):
        self.model_instance_0.node_count = 10
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for node count check '
                'of CollectionSummaryModel\', '
                '[u"Entity id 0: Node count: 10 does not match the number '
                'of nodes in collection_contents dict: [{u\'exploration_id\': '
                'u\'0\'}, {u\'exploration_id\': u\'1\'}]"]]'
            ), u'[u\'fully-validated CollectionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_ratings(self):
        self.model_instance_0.ratings = {'1': 0, '2': 1}
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        self.model_instance_1.ratings = {}
        self.model_instance_1.update_timestamps()
        self.model_instance_1.put()
        expected_output = [(
            u'[u\'failed validation check for ratings check of '
            'CollectionSummaryModel\', '
            '[u"Entity id 0: Expected ratings for the entity to be empty '
            'but received {u\'1\': 0, u\'2\': 1}"]]'
        ), u'[u\'fully-validated CollectionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_collection_related_property(self):
        self.model_instance_0.title = 'invalid'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for title field check of '
                'CollectionSummaryModel\', '
                '[u\'Entity id %s: title field in entity: invalid does not '
                'match corresponding collection title field: New title\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_collection_rights_related_property(self):
        self.model_instance_0.status = 'public'
        self.model_instance_0.update_timestamps()
        self.model_instance_0.put()
        expected_output = [
            (
                u'[u\'failed validation check for status field check of '
                'CollectionSummaryModel\', '
                '[u\'Entity id %s: status field in entity: public does not '
                'match corresponding collection rights status field: '
                'private\']]'
            ) % self.model_instance_0.id,
            u'[u\'fully-validated CollectionSummaryModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)
