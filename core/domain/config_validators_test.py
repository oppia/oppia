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

"""Unit tests for core.domain.config_validators."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.domain import prod_validation_jobs_one_off
from core.platform import models
from core.tests import test_utils
import feconf

(config_models, user_models,) = models.Registry.import_models([
    models.NAMES.config, models.NAMES.user])
datastore_services = models.Registry.import_datastore_services()


class ConfigPropertyModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(ConfigPropertyModelValidatorTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.model_instance = config_models.ConfigPropertyModel(
            id='config_model', value='c')
        self.model_instance.commit(feconf.SYSTEM_COMMITTER_ID, [])

        self.csrf_model_instance = config_models.ConfigPropertyModel.get_by_id(
            'oppia_csrf_secret')

        self.job_class = (
            prod_validation_jobs_one_off.ConfigPropertyModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated ConfigPropertyModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.commit(self.admin_id, [])
        expected_output = [
            (
                u'[u\'failed validation check for time field relation check '
                'of ConfigPropertyModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance.id,
                    self.model_instance.created_on,
                    self.model_instance.last_updated
                ),
            u'[u\'fully-validated ConfigPropertyModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.csrf_model_instance.delete(self.admin_id, '', [{}])
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ConfigPropertyModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_metadata_model_failure(self):
        config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
            'config_model-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids '
                'field check of ConfigPropertyModel\', '
                '[u"Entity id config_model: based on field '
                'snapshot_metadata_ids having '
                'value config_model-1, expected model '
                'ConfigPropertySnapshotMetadataModel '
                'with id config_model-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated ConfigPropertyModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_content_model_failure(self):
        config_models.ConfigPropertySnapshotContentModel.get_by_id(
            'config_model-1').delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids '
                'field check of ConfigPropertyModel\', '
                '[u"Entity id config_model: based on field '
                'snapshot_content_ids having '
                'value config_model-1, expected model '
                'ConfigPropertySnapshotContentModel '
                'with id config_model-1 but it doesn\'t exist"]]'),
            u'[u\'fully-validated ConfigPropertyModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class ConfigPropertySnapshotMetadataModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(ConfigPropertySnapshotMetadataModelValidatorTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        self.config_model = config_models.ConfigPropertyModel(
            id='config_model', value='c')
        self.config_model.commit(self.admin_id, [])

        user_models.UserSettingsModel(
            id=feconf.SYSTEM_COMMITTER_ID,
            email='system@committer.com').put()
        self.model_instance = (
            config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
                'config_model-1'))
        self.csrf_model_instance = (
            config_models.ConfigPropertySnapshotMetadataModel.get_by_id(
                'oppia_csrf_secret-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .ConfigPropertySnapshotMetadataModelAuditOneOffJob)

    def test_standard_operation(self):
        self.config_model.commit(self.admin_id, [])
        expected_output = [
            u'[u\'fully-validated ConfigPropertySnapshotMetadataModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_committer_id_migration_bot(self):
        self.model_instance.committer_id = feconf.MIGRATION_BOT_USER_ID
        self.model_instance.update_timestamps(update_last_updated_time=False)
        self.model_instance.put()

        expected_output = [
            u'[u\'fully-validated ConfigPropertySnapshotMetadataModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_pseudo_committer_id(self):
        self.model_instance.committer_id = self.PSEUDONYMOUS_ID
        self.model_instance.update_timestamps(update_last_updated_time=False)
        self.model_instance.put()

        expected_output = [
            u'[u\'fully-validated ConfigPropertySnapshotMetadataModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for time field relation check '
                'of ConfigPropertySnapshotMetadataModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance.id,
                    self.model_instance.created_on,
                    self.model_instance.last_updated),
            u'[u\'fully-validated ConfigPropertySnapshotMetadataModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.csrf_model_instance.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ConfigPropertySnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_config_property_model_failure(self):
        self.config_model.delete(self.admin_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for config_property_ids '
                'field check of ConfigPropertySnapshotMetadataModel\', '
                '[u"Entity id config_model-1: based on field '
                'config_property_ids having value config_model, '
                'expected model ConfigPropertyModel with '
                'id config_model but it doesn\'t exist", '
                'u"Entity id config_model-2: based on field '
                'config_property_ids having value config_model, expected model '
                'ConfigPropertyModel with id config_model but it doesn\'t '
                'exist"]]'
            ),
            u'[u\'fully-validated ConfigPropertySnapshotMetadataModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.admin_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of ConfigPropertySnapshotMetadataModel\', '
                '[u"Entity id config_model-1: based on field committer_ids '
                'having value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.admin_id, self.admin_id),
            u'[u\'fully-validated ConfigPropertySnapshotMetadataModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_config_property_model_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            config_models.ConfigPropertySnapshotMetadataModel(
                id='config_model-3', committer_id=self.admin_id,
                commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for config property model '
                'version check of ConfigPropertySnapshotMetadataModel\', '
                '[u\'Entity id config_model-3: ConfigProperty model '
                'corresponding to id config_model has a version 1 '
                'which is less than the version 3 in '
                'snapshot metadata model id\']]'
            ),
            u'[u\'fully-validated ConfigPropertySnapshotMetadataModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance.commit_cmds = [{
            'cmd': 'change_property_value',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd '
                'change_property_value check of '
                'ConfigPropertySnapshotMetadataModel\', '
                '[u"Entity id config_model-1: Commit command domain '
                'validation for command: {u\'cmd\': '
                'u\'change_property_value\', '
                'u\'invalid_attribute\': u\'invalid\'} failed with error: '
                'The following required attributes are missing: '
                'new_value, The following extra attributes are present: '
                'invalid_attribute"]]'
            ), u'[u\'fully-validated ConfigPropertySnapshotMetadataModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class ConfigPropertySnapshotContentModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(ConfigPropertySnapshotContentModelValidatorTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        self.config_model = config_models.ConfigPropertyModel(
            id='config_model', value='c')
        self.config_model.commit(self.admin_id, [])

        user_models.UserSettingsModel(
            id=feconf.SYSTEM_COMMITTER_ID,
            email='system@committer.com').put()
        self.model_instance = (
            config_models.ConfigPropertySnapshotContentModel.get_by_id(
                'config_model-1'))
        self.csrf_model_instance = (
            config_models.ConfigPropertySnapshotContentModel.get_by_id(
                'oppia_csrf_secret-1'))

        self.job_class = (
            prod_validation_jobs_one_off
            .ConfigPropertySnapshotContentModelAuditOneOffJob)

    def test_standard_operation(self):
        self.config_model.commit(self.admin_id, [])
        expected_output = [
            u'[u\'fully-validated ConfigPropertySnapshotContentModel\', 3]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for time field relation check '
                'of ConfigPropertySnapshotContentModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance.id,
                    self.model_instance.created_on,
                    self.model_instance.last_updated
                ),
            u'[u\'fully-validated ConfigPropertySnapshotContentModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        self.csrf_model_instance.delete()
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'ConfigPropertySnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_config_property_model_failure(self):
        self.config_model.delete(self.admin_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for config_property_ids '
                'field check of ConfigPropertySnapshotContentModel\', '
                '[u"Entity id config_model-1: based on field '
                'config_property_ids having value config_model, '
                'expected model ConfigPropertyModel with '
                'id config_model but it doesn\'t exist", '
                'u"Entity id config_model-2: based on field '
                'config_property_ids having value config_model, expected model '
                'ConfigPropertyModel with id config_model but it '
                'doesn\'t exist"]]'
            ),
            u'[u\'fully-validated ConfigPropertySnapshotContentModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)

    def test_invalid_config_property_model_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            config_models.ConfigPropertySnapshotContentModel(
                id='config_model-3'))
        model_with_invalid_version_in_id.content = {}
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for config property model '
                'version check of ConfigPropertySnapshotContentModel\', '
                '[u\'Entity id config_model-3: ConfigProperty model '
                'corresponding to id config_model has a version 1 '
                'which is less than the version 3 in snapshot '
                'content model id\']]'
            ),
            u'[u\'fully-validated ConfigPropertySnapshotContentModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class PlatformParameterModelValidatorTests(test_utils.AuditJobsTestBase):

    def setUp(self):
        super(PlatformParameterModelValidatorTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.parameter_model = config_models.PlatformParameterModel.create(
            param_name='parameter_model_1',
            rule_dicts=[
                {'filters': [], 'value_when_matched': True}
            ],
            rule_schema_version=(
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION))
        self.parameter_model.commit(feconf.SYSTEM_COMMITTER_ID, '', [])

        self.job_class = (
            prod_validation_jobs_one_off.PlatformParameterModelAuditOneOffJob)

    def test_standard_operation(self):
        expected_output = [
            u'[u\'fully-validated PlatformParameterModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.parameter_model.created_on = (
            self.parameter_model.last_updated + datetime.timedelta(days=1))
        self.parameter_model.commit(self.admin_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for time field relation check '
                'of PlatformParameterModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.parameter_model.id,
                    self.parameter_model.created_on,
                    self.parameter_model.last_updated
                )
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'PlatformParameterModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.parameter_model.id, self.parameter_model.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_metadata_model_failure(self):
        config_models.PlatformParameterSnapshotMetadataModel.get_by_id(
            '%s-1' % self.parameter_model.id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_metadata_ids field'
                ' check of PlatformParameterModel\', [u"Entity id %s: based on '
                'field snapshot_metadata_ids having value %s-1, expected model '
                'PlatformParameterSnapshotMetadataModel '
                'with id %s-1 but it doesn\'t exist"]]' % (
                    (self.parameter_model.id,) * 3))
        ]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_missing_snapshot_content_model_failure(self):
        config_models.PlatformParameterSnapshotContentModel.get_by_id(
            '%s-1' % self.parameter_model.id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for snapshot_content_ids field'
                ' check of PlatformParameterModel\', [u"Entity id %s: based on '
                'field snapshot_content_ids having value %s-1, expected model '
                'PlatformParameterSnapshotContentModel '
                'with id %s-1 but it doesn\'t exist"]]' % (
                    (self.parameter_model.id,) * 3))
        ]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)


class PlatformParameterSnapshotMetadataModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(
            PlatformParameterSnapshotMetadataModelValidatorTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        self.parameter_model = config_models.PlatformParameterModel.create(
            param_name='parameter_model_1',
            rule_dicts=[
                {'filters': [], 'value_when_matched': True}
            ],
            rule_schema_version=(
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION))
        self.parameter_model.commit(self.admin_id, '', [])

        user_models.UserSettingsModel(
            id=feconf.SYSTEM_COMMITTER_ID,
            email='system@committer.com').put()
        self.model_instance = (
            config_models.PlatformParameterSnapshotMetadataModel.get_by_id(
                '%s-1' % self.parameter_model.id))

        self.job_class = (
            prod_validation_jobs_one_off
            .PlatformParameterSnapshotMetadataModelAuditOneOffJob)

    def test_standard_operation(self):
        self.parameter_model.commit(self.admin_id, '', [])
        expected_output = [
            u'[u\'fully-validated PlatformParameterSnapshotMetadataModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_committer_id_migration_bot(self):
        self.model_instance.committer_id = feconf.MIGRATION_BOT_USER_ID
        self.model_instance.update_timestamps(update_last_updated_time=False)
        self.model_instance.put()

        expected_output = [
            u'[u\'fully-validated PlatformParameterSnapshotMetadataModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_pseudo_committer_id(self):
        self.model_instance.committer_id = self.PSEUDONYMOUS_ID
        self.model_instance.update_timestamps(update_last_updated_time=False)
        self.model_instance.put()

        expected_output = [
            u'[u\'fully-validated PlatformParameterSnapshotMetadataModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for time field relation check '
                'of PlatformParameterSnapshotMetadataModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance.id,
                    self.model_instance.created_on,
                    self.model_instance.last_updated)
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'PlatformParameterSnapshotMetadataModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_parameter_model_model_failure(self):
        self.parameter_model.delete(self.admin_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for platform_parameter_ids '
                'field check of PlatformParameterSnapshotMetadataModel\', '
                '[u"Entity id %s-1: based on field '
                'platform_parameter_ids having value %s, '
                'expected model PlatformParameterModel with '
                'id %s but it doesn\'t exist", '
                'u"Entity id %s-2: based on field '
                'platform_parameter_ids having value %s, expected model '
                'PlatformParameterModel with id %s but it doesn\'t '
                'exist"]]' % ((self.parameter_model.id,) * 6)
            )]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)

    def test_missing_committer_model_failure(self):
        user_models.UserSettingsModel.get_by_id(self.admin_id).delete()
        expected_output = [
            (
                u'[u\'failed validation check for committer_ids field '
                'check of PlatformParameterSnapshotMetadataModel\', '
                '[u"Entity id %s-1: based on field committer_ids '
                'having value %s, expected model UserSettingsModel with id %s '
                'but it doesn\'t exist"]]'
            ) % (self.parameter_model.id, self.admin_id, self.admin_id)
        ]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_invalid_parameter_model_model_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            config_models.PlatformParameterSnapshotMetadataModel(
                id='%s-3' % self.parameter_model.id, committer_id=self.admin_id,
                commit_type='edit',
                commit_message='msg', commit_cmds=[{}]))
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for platform parameter model '
                'version check of PlatformParameterSnapshotMetadataModel\', '
                '[u\'Entity id %s-3: PlatformParameter model corresponding to '
                'id %s has a version 1 which is less than the version 3 in '
                'snapshot metadata model id\']]' % (
                    self.parameter_model.id, self.parameter_model.id)
            ),
            u'[u\'fully-validated PlatformParameterSnapshotMetadataModel\', 1]']
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)

    def test_model_with_invalid_commit_cmd_schmea(self):
        self.model_instance.commit_cmds = [{
            'cmd': 'edit_rules',
            'invalid_attribute': 'invalid'
        }]
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for commit cmd edit_rules check '
                'of PlatformParameterSnapshotMetadataModel\', [u"Entity id '
                '%s-1: Commit command domain validation for command: {u\'cmd\''
                ': u\'edit_rules\', u\'invalid_attribute\': u\''
                'invalid\'} failed with error: The following required '
                'attributes are missing: new_rules, The following extra '
                'attributes are present: invalid_attribute"]]' % (
                    self.parameter_model.id)
            )
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)


class PlatformParameterSnapshotContentModelValidatorTests(
        test_utils.AuditJobsTestBase):

    def setUp(self):
        super(
            PlatformParameterSnapshotContentModelValidatorTests, self).setUp()

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        self.parameter_model = config_models.PlatformParameterModel.create(
            param_name='parameter_model_1',
            rule_dicts=[
                {'filters': [], 'value_when_matched': True}
            ],
            rule_schema_version=(
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION))
        self.parameter_model.commit(self.admin_id, '', [])

        user_models.UserSettingsModel(
            id=feconf.SYSTEM_COMMITTER_ID,
            email='system@committer.com').put()
        self.model_instance = (
            config_models.PlatformParameterSnapshotContentModel.get_by_id(
                '%s-1' % self.parameter_model.id))

        self.job_class = (
            prod_validation_jobs_one_off
            .PlatformParameterSnapshotContentModelAuditOneOffJob)

    def test_standard_operation(self):
        self.parameter_model.commit(self.admin_id, '', [])
        expected_output = [
            u'[u\'fully-validated PlatformParameterSnapshotContentModel\', 2]']
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_created_on_greater_than_last_updated(self):
        self.model_instance.created_on = (
            self.model_instance.last_updated + datetime.timedelta(days=1))
        self.model_instance.update_timestamps()
        self.model_instance.put()
        expected_output = [
            (
                u'[u\'failed validation check for time field relation check '
                'of PlatformParameterSnapshotContentModel\', '
                '[u\'Entity id %s: The created_on field has a value '
                '%s which is greater than the value '
                '%s of last_updated field\']]') % (
                    self.model_instance.id,
                    self.model_instance.created_on,
                    self.model_instance.last_updated
                )
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=False)

    def test_model_with_last_updated_greater_than_current_time(self):
        expected_output = [(
            u'[u\'failed validation check for current time check of '
            'PlatformParameterSnapshotContentModel\', '
            '[u\'Entity id %s: The last_updated field has a '
            'value %s which is greater than the time when the job was run\']]'
        ) % (self.model_instance.id, self.model_instance.last_updated)]

        mocked_datetime = datetime.datetime.utcnow() - datetime.timedelta(
            hours=13)
        with datastore_services.mock_datetime_for_datastore(mocked_datetime):
            self.run_job_and_check_output(
                expected_output, sort=True, literal_eval=False)

    def test_missing_platform_parameter_model_failure(self):
        self.parameter_model.delete(self.admin_id, '', [])
        expected_output = [
            (
                u'[u\'failed validation check for platform_parameter_ids '
                'field check of PlatformParameterSnapshotContentModel\', '
                '[u"Entity id %s-1: based on field platform_parameter_ids '
                'having value %s, expected model PlatformParameterModel with '
                'id %s but it doesn\'t exist", u"Entity id %s-2: based on '
                'field platform_parameter_ids having value %s, expected model '
                'PlatformParameterModel with id %s but it doesn\'t exist"]]' % (
                    (self.parameter_model.id,) * 6)
            ),
        ]
        self.run_job_and_check_output(
            expected_output, sort=False, literal_eval=True)

    def test_invalid_platform_parameter_model_version_in_model_id(self):
        model_with_invalid_version_in_id = (
            config_models.PlatformParameterSnapshotContentModel(
                id='%s-3' % (self.parameter_model.id)))
        model_with_invalid_version_in_id.content = {}
        model_with_invalid_version_in_id.update_timestamps()
        model_with_invalid_version_in_id.put()
        expected_output = [
            (
                u'[u\'failed validation check for platform parameter model '
                'version check of PlatformParameterSnapshotContentModel\', '
                '[u\'Entity id %s-3: PlatformParameter model corresponding '
                'to id %s has a version 1 which is less than the version 3 '
                'in snapshot content model id\']]' % (
                    (self.parameter_model.id,) * 2)
            ),
            u'[u\'fully-validated PlatformParameterSnapshotContentModel\', 1]'
        ]
        self.run_job_and_check_output(
            expected_output, sort=True, literal_eval=False)
