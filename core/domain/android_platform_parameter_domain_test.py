# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Tests for Android platform parameter domain objects."""

from __future__ import annotations

from core import feconf, utils
from core.domain import (
    android_platform_parameter_domain,
    platform_parameter_domain,
)
from core.tests import test_utils

from typing import List, Optional, cast


class AndroidPlatformParameterConfigTests(test_utils.GenericTestBase):
    """Tests for Android platform parameter config validation and evaluation."""

    def _create_config(
        self,
        rules: Optional[
            List[
                android_platform_parameter_domain.AndroidPlatformParameterRuleDict
            ]
        ] = None,
        default_value: Optional[
            android_platform_parameter_domain.AndroidPlatformParameterValue
        ] = False,
        rule_schema_version: Optional[int] = None,
        name: str = 'android_parameter',
    ) -> android_platform_parameter_domain.AndroidPlatformParameterConfig:
        """Creates an Android config with optional test overrides."""
        return android_platform_parameter_domain.AndroidPlatformParameterConfig(
            name,
            [
                android_platform_parameter_domain.AndroidPlatformParameterRule.from_dict(
                    rule_dict
                )
                for rule_dict in (rules or [])
            ],
            (
                rule_schema_version
                if rule_schema_version is not None
                else feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION
            ),
            default_value,
        )

    def _create_context(
        self, platform_type: str, app_version: Optional[str]
    ) -> platform_parameter_domain.EvaluationContext:
        """Creates a parameter evaluation context for a client."""
        return platform_parameter_domain.EvaluationContext.from_dict(
            {
                'platform_type': platform_type,
                'app_version': app_version,
            },
            {'server_mode': platform_parameter_domain.ServerMode.DEV},
        )

    def test_from_dict_and_to_dict_round_trip(self) -> None:
        config_dict: (
            android_platform_parameter_domain.AndroidPlatformParameterConfigDict
        ) = {
            'name': 'android_parameter',
            'rules': [
                {
                    'filters': [
                        {
                            'type': 'app_version',
                            'conditions': [['>=', '1.2.3']],
                        }
                    ],
                    'value_when_matched': True,
                }
            ],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION
            ),
            'default_value': False,
        }

        config = android_platform_parameter_domain.AndroidPlatformParameterConfig.from_dict(
            config_dict
        )

        self.assertDictEqual(config.to_dict(), config_dict)
        self.assertIsInstance(
            config.rules[0],
            android_platform_parameter_domain.AndroidPlatformParameterRule,
        )

    def test_validate_with_missing_default_value_raises_exception(
        self,
    ) -> None:
        config = self._create_config(default_value=None)

        with self.assertRaisesRegex(
            utils.ValidationError, 'must have a default value'
        ):
            config.validate()

    def test_validate_with_invalid_parameter_name_raises_exception(
        self,
    ) -> None:
        config = self._create_config(name='android.parameter')

        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid Android platform parameter name'
        ):
            config.validate()

    def test_validate_with_inconsistent_rule_value_raises_exception(
        self,
    ) -> None:
        config = self._create_config(
            rules=[
                {
                    'filters': [],
                    'value_when_matched': 'not a bool',
                }
            ]
        )

        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected bool.*value_when_matched'
        ):
            config.validate()

    def test_validate_rejects_web_specific_filter(self) -> None:
        config = self._create_config(
            rules=[
                {
                    'filters': [
                        {
                            'type': 'platform_type',
                            'conditions': [['=', 'Web']],
                        }
                    ],
                    'value_when_matched': True,
                }
            ]
        )

        with self.assertRaisesRegex(
            utils.ValidationError, 'Unsupported filter type \'platform_type\''
        ):
            config.validate()

    def test_from_dict_rejects_web_specific_fields(self) -> None:
        config_dict = cast(
            android_platform_parameter_domain.AndroidPlatformParameterConfigDict,
            {
                'name': 'android_parameter',
                'rules': [],
                'rule_schema_version': (
                    feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION
                ),
                'default_value': False,
                'data_type': 'bool',
            },
        )

        with self.assertRaisesRegex(
            utils.ValidationError, 'Web-specific fields'
        ):
            android_platform_parameter_domain.AndroidPlatformParameterConfig.from_dict(
                config_dict
            )

    def test_validate_rejects_invalid_android_filter_condition(self) -> None:
        config = self._create_config(
            rules=[
                {
                    'filters': [
                        {
                            'type': 'app_version',
                            'conditions': [['contains', '1.2.3']],
                        }
                    ],
                    'value_when_matched': True,
                }
            ]
        )

        with self.assertRaisesRegex(
            utils.ValidationError,
            'Unsupported comparison operator \'contains\'',
        ):
            config.validate()

    def test_validate_with_old_schema_version_raises_exception(self) -> None:
        config = self._create_config(rule_schema_version=0)

        with self.assertRaisesRegex(
            utils.ValidationError, 'Unsupported Android platform parameter'
        ):
            config.validate()

    def test_evaluate_returns_first_matching_rule(self) -> None:
        config = self._create_config(
            rules=[
                {
                    'filters': [
                        {
                            'type': 'app_version',
                            'conditions': [['>=', '1.0.0']],
                        }
                    ],
                    'value_when_matched': True,
                },
                {
                    'filters': [],
                    'value_when_matched': False,
                },
            ]
        )

        self.assertTrue(
            config.evaluate(self._create_context('Android', '2.0.0'))
        )

    def test_evaluate_returns_default_when_rules_do_not_match(self) -> None:
        config = self._create_config(
            rules=[
                {
                    'filters': [
                        {
                            'type': 'app_version',
                            'conditions': [['>=', '2.0.0']],
                        }
                    ],
                    'value_when_matched': True,
                }
            ]
        )

        self.assertFalse(
            config.evaluate(self._create_context('Android', '1.0.0'))
        )

    def test_evaluate_returns_default_for_non_android_context(self) -> None:
        config = self._create_config(
            rules=[{'filters': [], 'value_when_matched': True}]
        )

        self.assertFalse(config.evaluate(self._create_context('Web', None)))
