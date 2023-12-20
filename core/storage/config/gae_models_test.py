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

from __future__ import annotations

from core import feconf
from core.platform import models
from core.tests import test_utils

from typing import List

MYPY = False
if MYPY: # pragma: no cover
    # Here, we are importing 'platform_parameter_domain' only for type checking.
    from core.domain import platform_parameter_domain
    from mypy_imports import base_models
    from mypy_imports import config_models

(base_models, config_models) = models.Registry.import_models([
    models.Names.BASE_MODEL, models.Names.CONFIG
])


class ConfigPropertySnapshotContentModelTests(test_utils.GenericTestBase):

    def test_get_deletion_policy_is_not_applicable(self) -> None:
        self.assertEqual(
            config_models.ConfigPropertySnapshotContentModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)


class ConfigPropertyModelUnitTests(test_utils.GenericTestBase):
    """Test ConfigPropertyModel class."""

    def test_get_deletion_policy(self) -> None:
        self.assertEqual(
            config_models.ConfigPropertyModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_create_model(self) -> None:
        config_model = config_models.ConfigPropertyModel(
            value='b')
        self.assertEqual(config_model.value, 'b')

    def test_commit(self) -> None:
        config_model1 = config_models.ConfigPropertyModel(
            id='config_model1', value='c')
        config_model1.commit(feconf.SYSTEM_COMMITTER_ID, [])
        retrieved_model1 = config_models.ConfigPropertyModel.get_version(
            'config_model1', 1)
        # Ruling out the possibility of None for mypy type checking.
        assert retrieved_model1 is not None

        self.assertEqual(retrieved_model1.value, 'c')
        retrieved_model1.value = 'd'
        retrieved_model1.commit(feconf.SYSTEM_COMMITTER_ID, [])
        retrieved_model2 = config_models.ConfigPropertyModel.get_version(
            'config_model1', 2)
        # Ruling out the possibility of None for mypy type checking.
        assert retrieved_model2 is not None

        self.assertEqual(retrieved_model2.value, 'd')

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            config_models.ConfigPropertyModel.get_model_association_to_user(),
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'value': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            config_models.ConfigPropertyModel.get_export_policy(),
            expected_export_policy_dict
        )


class PlatformParameterSnapshotContentModelTests(test_utils.GenericTestBase):

    def test_get_deletion_policy_is_not_applicable(self) -> None:
        self.assertEqual(
            config_models.PlatformParameterSnapshotContentModel
            .get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)


class PlatformParameterModelUnitTests(test_utils.GenericTestBase):
    """Test PlatformParameterModel class."""

    def test_get_deletion_policy_is_not_applicable(self) -> None:
        self.assertEqual(
            config_models.PlatformParameterModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_create_model(self) -> None:
        param_model = config_models.PlatformParameterModel.create(
            param_name='parameter_name',
            rule_dicts=[{'filters': [], 'value_when_matched': False}],
            rule_schema_version=(
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            default_value=False
        )
        self.assertEqual(param_model.id, 'parameter_name')
        self.assertEqual(
            param_model.rule_schema_version,
            feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION)
        self.assertEqual(
            param_model.rules,
            [{'filters': [], 'value_when_matched': False}])
        self.assertEqual(param_model.default_value, False)

    def test_commit(self) -> None:
        parameter_name = 'parameter_name'
        rule_dicts: List[
            platform_parameter_domain.PlatformParameterRuleDict
        ] = [{'filters': [], 'value_when_matched': False}]

        param_model = config_models.PlatformParameterModel.create(
            param_name=parameter_name,
            rule_dicts=rule_dicts,
            rule_schema_version=(
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            default_value=False
        )

        param_model.commit(feconf.SYSTEM_COMMITTER_ID, 'commit message', [])

        retrieved_model1 = config_models.PlatformParameterModel.get_version(
            parameter_name, 1)
        # Ruling out the possibility of None for mypy type checking.
        assert retrieved_model1 is not None

        self.assertEqual(retrieved_model1.rules, rule_dicts)

        new_rules: List[platform_parameter_domain.PlatformParameterRuleDict] = [
            {
                'filters': [
                    {'type': 'app_version', 'conditions': [['>', '1.2.3']]}
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
        # Ruling out the possibility of None for mypy type checking.
        assert retrieved_model2 is not None

        self.assertEqual(retrieved_model2.rules, new_rules)

    def test_commit_is_persistent_in_storage(self) -> None:
        parameter_name = 'parameter_name'
        rule_dicts: List[
            platform_parameter_domain.PlatformParameterRuleDict
        ] = [{'filters': [], 'value_when_matched': False}]

        param_model = config_models.PlatformParameterModel.create(
            param_name=parameter_name,
            rule_dicts=rule_dicts,
            rule_schema_version=(
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            default_value=False
        )

        param_model.commit(feconf.SYSTEM_COMMITTER_ID, 'commit message', [])

        retrieved_model1 = config_models.PlatformParameterModel.get_version(
            parameter_name, 1)
        # Ruling out the possibility of None for mypy type checking.
        assert retrieved_model1 is not None
        self.assertEqual(retrieved_model1.rules, rule_dicts)

    def test_commit_with_updated_rules(self) -> None:
        parameter_name = 'parameter_name'
        rule_dicts: List[
            platform_parameter_domain.PlatformParameterRuleDict
        ] = [{'filters': [], 'value_when_matched': False}]

        param_model = config_models.PlatformParameterModel.create(
            param_name=parameter_name,
            rule_dicts=rule_dicts,
            rule_schema_version=(
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            default_value=False
        )
        param_model.commit(feconf.SYSTEM_COMMITTER_ID, 'commit message', [])

        new_rules: List[platform_parameter_domain.PlatformParameterRuleDict] = [
            {
                'filters': [
                    {'type': 'app_version', 'conditions': [['>', '1.2.3']]}
                ],
                'value_when_matched': True
            },
            {'filters': [], 'value_when_matched': False},
        ]

        param_model.rules = new_rules
        param_model.commit(feconf.SYSTEM_COMMITTER_ID, 'commit message', [])
        retrieved_model = config_models.PlatformParameterModel.get_version(
            parameter_name, 2)
        # Ruling out the possibility of None for mypy type checking.
        assert retrieved_model is not None

        self.assertEqual(retrieved_model.rules, new_rules)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            config_models.PlatformParameterModel.get_model_association_to_user(), # pylint: disable=line-too-long
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'rules': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'rule_schema_version': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'default_value': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            config_models.PlatformParameterModel.get_export_policy(),
            expected_export_policy_dict
        )


class FeatureFlagConfigModelUnitTests(test_utils.GenericTestBase):
    """Test FeatureFlagConfigModel class."""

    def test_get_deletion_policy_is_not_applicable(self) -> None:
        self.assertEqual(
            config_models.FeatureFlagConfigModel.get_deletion_policy(),
            base_models.DELETION_POLICY.NOT_APPLICABLE)

    def test_create_model(self) -> None:
        feature_model = config_models.FeatureFlagConfigModel.create(
            feature_flag_name='feature_name',
            force_enable_for_all_users=False,
            rollout_percentage=50,
            user_group_ids=['User Group 1', 'User Group 2']
        )
        self.assertEqual(feature_model.id, 'feature_name')
        self.assertEqual(feature_model.rollout_percentage, 50)
        self.assertEqual(
            feature_model.user_group_ids,
            ['User Group 1', 'User Group 2'])
        self.assertEqual(feature_model.force_enable_for_all_users, False)

    def test_get_model_association_to_user(self) -> None:
        self.assertEqual(
            config_models.FeatureFlagConfigModel.get_model_association_to_user(), # pylint: disable=line-too-long
            base_models.MODEL_ASSOCIATION_TO_USER.NOT_CORRESPONDING_TO_USER
        )

    def test_get_export_policy(self) -> None:
        expected_export_policy_dict = {
            'created_on': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'last_updated': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'deleted': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'force_enable_for_all_users': (
                base_models.EXPORT_POLICY.NOT_APPLICABLE),
            'rollout_percentage': base_models.EXPORT_POLICY.NOT_APPLICABLE,
            'user_group_ids': base_models.EXPORT_POLICY.NOT_APPLICABLE
        }
        self.assertEqual(
            config_models.FeatureFlagConfigModel.get_export_policy(),
            expected_export_policy_dict
        )
