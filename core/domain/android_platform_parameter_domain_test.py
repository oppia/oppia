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
from core.domain import android_platform_parameter_domain
from core.tests import test_utils

from typing import List, Optional, cast

parameter_domain = android_platform_parameter_domain


class AndroidEvaluationContextTests(test_utils.GenericTestBase):
    """Tests for AndroidEvaluationContext."""

    def test_from_dict_and_to_dict_round_trip(self) -> None:
        context_dict: parameter_domain.AndroidEvaluationContextDict = {
            'app_version': '12.5-5f58b8fbeb-dev',
            'app_version_flavour': 'dev',
        }
        context = parameter_domain.AndroidEvaluationContext.from_dict(
            context_dict
        )

        self.assertEqual(context.app_version, '12.5-5f58b8fbeb-dev')
        self.assertEqual(context.app_version_flavour, 'dev')
        self.assertDictEqual(context.to_dict(), context_dict)

    def test_validate_accepts_valid_context(self) -> None:
        context = parameter_domain.AndroidEvaluationContext(
            '12.5-5f58b8fbeb-dev', 'dev'
        )
        context.validate()

    def test_validate_rejects_invalid_version(self) -> None:
        context = parameter_domain.AndroidEvaluationContext(
            '12.x-5f58b8fbeb-dev', 'beta'
        )

        with self.assertRaisesRegex(utils.ValidationError, 'Invalid Android'):
            context.validate()

    def test_validate_rejects_invalid_flavour(self) -> None:
        context = parameter_domain.AndroidEvaluationContext(
            '12.5-5f58b8fbeb-dev', 'unknown'
        )

        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid Android app version flavour'
        ):
            context.validate()


class AndroidPlatformParameterFilterTests(test_utils.GenericTestBase):
    """Tests for Android platform parameter filters."""

    def _create_context(
        self,
        app_version: str = '12.5-5f58b8fbeb-dev',
        app_version_flavour: str = 'dev',
    ) -> parameter_domain.AndroidEvaluationContext:
        """Creates an Android evaluation context."""
        return parameter_domain.AndroidEvaluationContext(
            app_version, app_version_flavour
        )

    def test_from_dict_and_to_dict_round_trip(self) -> None:
        filter_dict: parameter_domain.AndroidPlatformParameterFilterDict = {
            'type': 'app_min_version',
            'conditions': [['=', '12.5']],
        }
        filter_domain = (
            parameter_domain.AndroidPlatformParameterFilter.from_dict(
                filter_dict
            )
        )

        self.assertEqual(filter_domain.type, 'app_min_version')
        self.assertEqual(filter_domain.conditions, [['=', '12.5']])
        self.assertDictEqual(filter_domain.to_dict(), filter_dict)

    def test_validate_rejects_unsupported_filter_type(self) -> None:
        filter_domain = parameter_domain.AndroidPlatformParameterFilter(
            'app_version', [['=', '12.5']]
        )

        with self.assertRaisesRegex(
            utils.ValidationError, 'Unsupported Android.*filter type'
        ):
            filter_domain.validate()

    def test_validate_rejects_malformed_condition(self) -> None:
        filter_domain = parameter_domain.AndroidPlatformParameterFilter(
            'app_min_version', [['=']]
        )

        with self.assertRaisesRegex(
            utils.ValidationError, 'must contain a string operator'
        ):
            filter_domain.validate()

    def test_validate_rejects_unsupported_operator(self) -> None:
        filter_domain = parameter_domain.AndroidPlatformParameterFilter(
            'app_min_version', [['>=', '12.5']]
        )

        with self.assertRaisesRegex(
            utils.ValidationError, 'Unsupported comparison operator'
        ):
            filter_domain.validate()

    def test_validate_rejects_invalid_version_condition(self) -> None:
        filter_domain = parameter_domain.AndroidPlatformParameterFilter(
            'app_max_version', [['=', 'one.two']]
        )

        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid Android app version expression'
        ):
            filter_domain.validate()

    def test_validate_rejects_invalid_flavour_condition(self) -> None:
        filter_domain = parameter_domain.AndroidPlatformParameterFilter(
            'app_version_flavour', [['=', 'unknown']]
        )

        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid Android app version flavour'
        ):
            filter_domain.validate()

    def test_evaluate_app_min_version_inclusive(self) -> None:
        filter_domain = parameter_domain.AndroidPlatformParameterFilter(
            'app_min_version', [['=', '12.5']]
        )

        self.assertTrue(
            filter_domain.evaluate(
                self._create_context('12.5-5f58b8fbeb-dev', 'dev')
            )
        )
        self.assertTrue(
            filter_domain.evaluate(
                self._create_context('12.6-5f58b8fbeb-dev', 'dev')
            )
        )
        self.assertFalse(
            filter_domain.evaluate(
                self._create_context('12.4-5f58b8fbeb-dev', 'dev')
            )
        )

    def test_evaluate_app_max_version_inclusive(self) -> None:
        filter_domain = parameter_domain.AndroidPlatformParameterFilter(
            'app_max_version', [['=', '12.5']]
        )

        self.assertTrue(
            filter_domain.evaluate(
                self._create_context('12.5-5f58b8fbeb-dev', 'dev')
            )
        )
        self.assertTrue(
            filter_domain.evaluate(
                self._create_context('12.4-5f58b8fbeb-dev', 'dev')
            )
        )
        self.assertFalse(
            filter_domain.evaluate(
                self._create_context('12.6-5f58b8fbeb-dev', 'dev')
            )
        )

    def test_evaluate_flavour_filter(self) -> None:
        filter_domain = parameter_domain.AndroidPlatformParameterFilter(
            'app_version_flavour', [['=', 'dev']]
        )

        self.assertTrue(filter_domain.evaluate(self._create_context()))
        self.assertFalse(
            filter_domain.evaluate(
                self._create_context(app_version_flavour='alpha')
            )
        )

    def test_evaluate_unknown_type_returns_false(self) -> None:
        filter_domain = parameter_domain.AndroidPlatformParameterFilter(
            'unknown', [['=', '12.5']]
        )

        self.assertFalse(filter_domain.evaluate(self._create_context()))

    def test_evaluate_empty_conditions_returns_false(self) -> None:
        filter_domain = parameter_domain.AndroidPlatformParameterFilter(
            'app_min_version', []
        )

        self.assertFalse(filter_domain.evaluate(self._create_context()))


class AndroidPlatformParameterRuleTests(test_utils.GenericTestBase):
    """Tests for Android platform parameter rules."""

    def _create_context(self) -> parameter_domain.AndroidEvaluationContext:
        """Creates an Android evaluation context."""
        return parameter_domain.AndroidEvaluationContext(
            '12.5-5f58b8fbeb-dev', 'dev'
        )

    def test_from_dict_and_to_dict_round_trip(self) -> None:
        rule_dict: parameter_domain.AndroidPlatformParameterRuleDict = {
            'filters': [
                {
                    'type': 'app_min_version',
                    'conditions': [['=', '1.2.0']],
                }
            ],
            'value_when_matched': True,
        }
        rule = parameter_domain.AndroidPlatformParameterRule.from_dict(
            rule_dict
        )

        self.assertIsInstance(
            rule.filters[0], parameter_domain.AndroidPlatformParameterFilter
        )
        self.assertDictEqual(rule.to_dict(), rule_dict)

    def test_evaluate_requires_all_filters_to_match(self) -> None:
        rule = parameter_domain.AndroidPlatformParameterRule.from_dict(
            {
                'filters': [
                    {
                        'type': 'app_min_version',
                        'conditions': [['=', '1.0.0']],
                    },
                    {
                        'type': 'app_version_flavour',
                        'conditions': [['=', 'release']],
                    },
                ],
                'value_when_matched': True,
            }
        )

        self.assertFalse(rule.evaluate(self._create_context()))

    def test_evaluate_empty_filters_matches(self) -> None:
        rule = parameter_domain.AndroidPlatformParameterRule([], True)

        self.assertTrue(rule.evaluate(self._create_context()))

    def test_validate_checks_filters(self) -> None:
        rule = parameter_domain.AndroidPlatformParameterRule.from_dict(
            {
                'filters': [
                    {
                        'type': 'app_min_version',
                        'conditions': [['=', '1.2.3']],
                    }
                ],
                'value_when_matched': True,
            }
        )
        rule.validate()


class AndroidPlatformParameterTests(test_utils.GenericTestBase):
    """Tests for Android platform parameter validation and evaluation."""

    def _create_parameter(
        self,
        rules: Optional[
            List[parameter_domain.AndroidPlatformParameterRuleDict]
        ] = None,
        default_value: Optional[
            parameter_domain.AndroidPlatformDataTypes
        ] = False,
        data_type: str = 'bool',
        name: str = 'android_parameter',
        rule_schema_version: Optional[int] = None,
        description: str = '',
    ) -> parameter_domain.AndroidPlatformParameter:
        """Creates an Android parameter with optional test overrides."""
        return parameter_domain.AndroidPlatformParameter(
            name,
            description,
            data_type,
            [
                parameter_domain.AndroidPlatformParameterRule.from_dict(
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
        self,
        app_version: str = '12.5-5f58b8fbeb-dev',
        flavour: str = 'dev',
    ) -> parameter_domain.AndroidEvaluationContext:
        """Creates an Android evaluation context."""
        return parameter_domain.AndroidEvaluationContext(app_version, flavour)

    def test_from_dict_and_to_dict_round_trip(self) -> None:
        param_dict: parameter_domain.AndroidPlatformParameterDict = {
            'name': 'android_parameter',
            'description': '',
            'data_type': 'bool',
            'rules': [
                {
                    'filters': [
                        {
                            'type': 'app_min_version',
                            'conditions': [['=', '1.2.0']],
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
        parameter = parameter_domain.AndroidPlatformParameter.from_dict(
            param_dict
        )

        self.assertEqual(parameter.name, 'android_parameter')
        self.assertEqual(parameter.data_type, 'bool')
        self.assertEqual(parameter.default_value, False)
        self.assertDictEqual(parameter.to_dict(), param_dict)

    def test_from_dict_infers_type_for_current_model_shape(self) -> None:
        config_dict = cast(
            parameter_domain.AndroidPlatformParameterDict,
            {
                'name': 'android_parameter',
                'rules': [],
                'rule_schema_version': (
                    feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION
                ),
                'default_value': 3,
            },
        )
        parameter = parameter_domain.AndroidPlatformParameter.from_dict(
            config_dict
        )

        self.assertEqual(parameter.data_type, 'number')
        self.assertEqual(parameter.default_value, 3)
        self.assertEqual(parameter.description, '')

    def test_validate_accepts_all_supported_data_types(self) -> None:
        parameters = [
            self._create_parameter(default_value=True, data_type='bool'),
            self._create_parameter(default_value='value', data_type='string'),
            self._create_parameter(default_value=3, data_type='number'),
            self._create_parameter(default_value=3.5, data_type='number'),
        ]

        for parameter in parameters:
            with self.subTest(data_type=parameter.data_type):
                parameter.validate()

    def test_validate_rejects_invalid_name(self) -> None:
        parameter = self._create_parameter(name='android.parameter')

        with self.assertRaisesRegex(
            utils.ValidationError, 'Invalid Android platform parameter name'
        ):
            parameter.validate()

    def test_validate_rejects_unsupported_data_type(self) -> None:
        parameter = self._create_parameter(data_type='integer')

        with self.assertRaisesRegex(
            utils.ValidationError, 'Unsupported Android platform parameter'
        ):
            parameter.validate()

    def test_validate_rejects_missing_default(self) -> None:
        parameter = self._create_parameter(default_value=None)

        with self.assertRaisesRegex(
            utils.ValidationError, 'must have a default value'
        ):
            parameter.validate()

    def test_validate_rejects_default_type_mismatch(self) -> None:
        parameter = self._create_parameter(default_value='false')

        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected bool.*default value'
        ):
            parameter.validate()

    def test_validate_rejects_old_schema_version(self) -> None:
        parameter = self._create_parameter(rule_schema_version=0)

        with self.assertRaisesRegex(
            utils.ValidationError, 'Unsupported Android platform parameter'
        ):
            parameter.validate()

    def test_validate_rejects_invalid_rule(self) -> None:
        parameter = self._create_parameter(
            rules=[{'filters': [], 'value_when_matched': 'true'}]
        )

        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected bool.*value_when_matched'
        ):
            parameter.validate()

    def test_validate_rejects_invalid_filter(self) -> None:
        parameter = self._create_parameter(
            rules=[
                {
                    'filters': [
                        {
                            'type': 'platform_type',
                            'conditions': [['=', 'Android']],
                        }
                    ],
                    'value_when_matched': True,
                }
            ]
        )

        with self.assertRaisesRegex(
            utils.ValidationError, 'Unsupported Android.*filter type'
        ):
            parameter.validate()

    def test_evaluate_returns_first_matching_rule(self) -> None:
        parameter = self._create_parameter(
            rules=[
                {
                    'filters': [
                        {
                            'type': 'app_min_version',
                            'conditions': [['=', '1.0.0']],
                        }
                    ],
                    'value_when_matched': True,
                },
                {'filters': [], 'value_when_matched': False},
            ]
        )

        self.assertTrue(parameter.evaluate(self._create_context()))

    def test_evaluate_matches_version_and_flavour_filters_together(
        self,
    ) -> None:
        parameter = self._create_parameter(
            rules=[
                {
                    'filters': [
                        {
                            'type': 'app_min_version',
                            'conditions': [['=', '2.0.0']],
                        },
                        {
                            'type': 'app_max_version',
                            'conditions': [['=', '3.0.0']],
                        },
                        {
                            'type': 'app_version_flavour',
                            'conditions': [['>=', 'beta']],
                        },
                    ],
                    'value_when_matched': True,
                }
            ],
            default_value=False,
        )

        test_cases = [
            ('2.5.0', 'beta', True),
            ('2.5.0', 'release', True),
            ('1.9.9', 'beta', False),
            ('3.0.1', 'release', False),
            ('2.5.0', 'alpha', False),
        ]
        for app_version, app_version_flavour, expected_value in test_cases:
            with self.subTest(
                app_version=app_version,
                app_version_flavour=app_version_flavour,
            ):
                context = self._create_context(app_version, app_version_flavour)
                self.assertIs(
                    parameter.evaluate(context),
                    expected_value,
                )

    def test_evaluate_returns_default_when_no_rule_matches(self) -> None:
        parameter = self._create_parameter(
            rules=[
                {
                    'filters': [
                        {
                            'type': 'app_min_version',
                            'conditions': [['=', '2.0.0']],
                        }
                    ],
                    'value_when_matched': True,
                }
            ]
        )

        self.assertFalse(parameter.evaluate(self._create_context()))

    def test_evaluate_rejects_invalid_context(self) -> None:
        parameter = self._create_parameter()

        with self.assertRaisesRegex(utils.ValidationError, 'Invalid Android'):
            parameter.evaluate(self._create_context('invalid'))

    def test_setters_update_parameter_values(self) -> None:
        parameter = self._create_parameter()
        rule = parameter_domain.AndroidPlatformParameterRule([], True)
        parameter.set_rules([rule])
        parameter.set_default_value(True)

        self.assertEqual(parameter.rules, [rule])
        self.assertIs(parameter.default_value, True)

    def test_serialize_and_deserialize_returns_same_parameter(self) -> None:
        parameter = self._create_parameter(
            rules=[
                {
                    'filters': [
                        {
                            'type': 'app_version_flavour',
                            'conditions': [['=', 'beta']],
                        }
                    ],
                    'value_when_matched': True,
                }
            ]
        )

        restored = parameter_domain.AndroidPlatformParameter.deserialize(
            parameter.serialize()
        )
        self.assertDictEqual(restored.to_dict(), parameter.to_dict())

    def test_to_dict_rejects_missing_default(self) -> None:
        parameter = self._create_parameter(default_value=None)

        with self.assertRaisesRegex(
            utils.ValidationError, 'must have a default value'
        ):
            parameter.to_dict()

    def test_from_dict_can_infer_unsupported_default_type(self) -> None:
        # Here we use cast because this test intentionally supplies an invalid
        # default value to verify type inference rejects unsupported values.
        config_dict = cast(
            parameter_domain.AndroidPlatformParameterDict,
            {
                'name': 'android_parameter',
                'rules': [],
                'rule_schema_version': (
                    feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION
                ),
                'default_value': [],
            },
        )
        parameter = parameter_domain.AndroidPlatformParameter.from_dict(
            config_dict
        )

        self.assertEqual(parameter.data_type, '')
