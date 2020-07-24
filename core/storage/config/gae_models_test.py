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

"""Tests for core.storage.config.gae_models."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.platform import models
from core.tests import test_utils
import feconf

(base_models, config_models) = models.Registry.import_models(
    [models.NAMES.base_model, models.NAMES.config])


class ConfigPropertyModelUnitTests(test_utils.GenericTestBase):
    """Test ConfigPropertyModel class."""

    def test_get_deletion_policy(self):
        self.assertEqual(
            config_models.ConfigPropertyModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_create_model(self):
        config_model = config_models.ConfigPropertyModel(
            value='b')
        self.assertEqual(config_model.value, 'b')

    def test_commit(self):
        config_model1 = config_models.ConfigPropertyModel(
            id='config_model1', value='c')
        config_model1.commit(feconf.SYSTEM_COMMITTER_ID, [])
        retrieved_model1 = config_models.ConfigPropertyModel.get_version(
            'config_model1', 1)
        self.assertEqual(retrieved_model1.value, 'c')
        retrieved_model1.value = 'd'
        retrieved_model1.commit(feconf.SYSTEM_COMMITTER_ID, [])
        retrieved_model2 = config_models.ConfigPropertyModel.get_version(
            'config_model1', 2)
        self.assertEqual(retrieved_model2.value, 'd')


class PlatformParameterModelUnitTests(test_utils.GenericTestBase):
    """Test PlatformParameterModel class."""

    def test_get_deletion_policy_is_not_applicable(self):
        self.assertEqual(
            config_models.PlatformParameterModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_get_export_policy_is_not_applicable(self):
        self.assertEqual(
            config_models.PlatformParameterModel.get_export_policy(),
            base_models.EXPORT_POLICY.NOT_APPLICABLE)

    def test_create_model(self):
        param_model = config_models.PlatformParameterModel.create(
            param_name='parameter_name',
            rule_dicts=[{'filters': [], 'value_when_matched': False}],
            rule_schema_version=(
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
        )
        self.assertEqual(param_model.id, 'parameter_name')
        self.assertEqual(
            param_model.rule_schema_version,
            feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION)
        self.assertEqual(
            param_model.rules,
            [{'filters': [], 'value_when_matched': False}])

    def test_commit(self):
        parameter_name = 'parameter_name'
        rule_dicts = [{'filters': [], 'value_when_matched': False}]

        param_model = config_models.PlatformParameterModel.create(
            param_name=parameter_name,
            rule_dicts=rule_dicts,
            rule_schema_version=(
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
        )

        param_model.commit(feconf.SYSTEM_COMMITTER_ID, 'commit message', [])

        retrieved_model1 = config_models.PlatformParameterModel.get_version(
            parameter_name, 1)
        self.assertEqual(retrieved_model1.rules, rule_dicts)

        new_rules = [
            {
                'filters': [
                    {'type': 'app_version', 'value': '>1.2.3'}
                ],
                'value_when_matched': True
            },
            {'filters': [], 'value_when_matched': False},
        ]

        retrieved_model1.rules = new_rules
        retrieved_model1.commit(
            feconf.SYSTEM_COMMITTER_ID, 'commit message', [])
        retrieved_model2 = config_models.PlatformParameterModel.get_version(
            parameter_name, 2)

        self.assertEqual(retrieved_model2.rules, new_rules)

    def test_commit_is_persistent_in_storage(self):
        parameter_name = 'parameter_name'
        rule_dicts = [{'filters': [], 'value_when_matched': False}]

        param_model = config_models.PlatformParameterModel.create(
            param_name=parameter_name,
            rule_dicts=rule_dicts,
            rule_schema_version=(
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
        )

        param_model.commit(feconf.SYSTEM_COMMITTER_ID, 'commit message', [])

        retrieved_model1 = config_models.PlatformParameterModel.get_version(
            parameter_name, 1)
        self.assertEqual(retrieved_model1.rules, rule_dicts)

    def test_commit_with_updated_rules(self):
        parameter_name = 'parameter_name'
        rule_dicts = [{'filters': [], 'value_when_matched': False}]

        param_model = config_models.PlatformParameterModel.create(
            param_name=parameter_name,
            rule_dicts=rule_dicts,
            rule_schema_version=(
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
        )
        param_model.commit(feconf.SYSTEM_COMMITTER_ID, 'commit message', [])

        new_rules = [
            {
                'filters': [
                    {'type': 'app_version', 'value': '>1.2.3'}
                ],
                'value_when_matched': True
            },
            {'filters': [], 'value_when_matched': False},
        ]

        param_model.rules = new_rules
        param_model.commit(feconf.SYSTEM_COMMITTER_ID, 'commit message', [])
        retrieved_model = config_models.PlatformParameterModel.get_version(
            parameter_name, 2)

        self.assertEqual(retrieved_model.rules, new_rules)
