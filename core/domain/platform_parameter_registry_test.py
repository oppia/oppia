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

"""Tests for the platform parameter registry."""

from __future__ import annotations

import enum

from core import feconf
from core import utils
from core.domain import caching_services
from core.domain import platform_parameter_domain as parameter_domain
from core.domain import platform_parameter_registry as registry
from core.tests import test_utils

from typing import List

DataTypes = parameter_domain.DataTypes
FeatureStages = parameter_domain.FeatureStages


class ParamName(enum.Enum):
    """Enum for parameter names."""

    PARAMETER_A = 'parameter_a'


class PlatformParameterRegistryTests(test_utils.GenericTestBase):
    """Tests for the platform parameter Registry."""

    def setUp(self) -> None:
        super().setUp()

        self.original_parameter_registry = (
            registry.Registry.parameter_registry.copy())
        registry.Registry.parameter_registry.clear()

        # Parameter names that might be used in following tests.
        parameter_names = ['parameter_a', 'parameter_b']
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_PLATFORM_PARAMETER, None,
            parameter_names)

    def tearDown(self) -> None:
        super().tearDown()

        registry.Registry.parameter_registry = self.original_parameter_registry

    def _create_example_parameter_with_name(self, name: str) -> None:
        """Creates and returns an example parameter with the given name."""
        registry.Registry.init_platform_parameter_from_dict({
            'name': name,
            'description': 'for test',
            'data_type': DataTypes.STRING.value,
            'rules': [
                {
                    'filters': [
                        {
                            'type': 'platform_type',
                            'conditions': [['=', 'Backend']]
                        }
                    ],
                    'value_when_matched': '222'
                }
            ],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'default_value': '111'
        })

    def _create_dummy_platform_parameter(
        self, data_types: DataTypes) -> parameter_domain.PlatformParameter:
        """Creates dummy platform parameter."""
        # Here we use MyPy ignore because we use dummy platform parameter
        # names for our tests and create_platform_parameter only accepts
        # platform parameter name of type platform_parameter_list.ParamName.
        return registry.Registry.create_platform_parameter(
            ParamName.PARAMETER_A, 'test', data_types) # type: ignore[arg-type]

    def test_create_platform_parameter(self) -> None:
        parameter = self._create_dummy_platform_parameter(DataTypes.BOOL)
        self.assertIsInstance(parameter, parameter_domain.PlatformParameter)
        parameter.validate()

    def test_create_platform_parameter_with_invalid_type_failure(self) -> None:
        class DataType(enum.Enum):
            """Enum for data type."""

            INVALID = 'invalid'
        with self.assertRaisesRegex(
            Exception, 'Unsupported data type \'invalid\''):
            # TODO(#13059): Here we use MyPy ignore because after we fully type
            # the codebase we plan to get rid of the tests that intentionally
            # test wrong inputs that we can normally catch by typing.
            registry.Registry.create_platform_parameter(
                ParamName.PARAMETER_A, 'test', DataType.INVALID)  # type: ignore[arg-type]

    def test_create_platform_parameter_with_the_same_name_failure(self) -> None:
        param_name = 'parameter_a'
        self._create_example_parameter_with_name(param_name)
        with self.assertRaisesRegex(
            Exception, 'Parameter with name %s already exists' % param_name):
            self._create_example_parameter_with_name(param_name)

    def test_default_value_of_bool_platform_parameter(self) -> None:
        parameter = self._create_dummy_platform_parameter(DataTypes.BOOL)
        parameter.validate()
        self.assertEqual(parameter.default_value, False)

    def test_default_value_of_string_platform_parameter(self) -> None:
        parameter = self._create_dummy_platform_parameter(DataTypes.STRING)
        parameter.validate()
        self.assertEqual(parameter.default_value, '')

    def test_default_value_of_number_platform_parameter(self) -> None:
        parameter = self._create_dummy_platform_parameter(DataTypes.NUMBER)
        parameter.validate()
        self.assertEqual(parameter.default_value, 0)

    def test_get_platform_parameter(self) -> None:
        parameter_name = 'parameter_a'
        self._create_example_parameter_with_name(parameter_name)
        parameter = registry.Registry.get_platform_parameter(parameter_name)
        self.assertIsNotNone(parameter)
        self.assertIsInstance(parameter, parameter_domain.PlatformParameter)

    def test_get_non_existing_parameter_failure(self) -> None:
        with self.assertRaisesRegex(Exception, 'not found'):
            registry.Registry.get_platform_parameter('parameter_a')

    def test_get_all_parameter_names(self) -> None:
        parameter_names = ['parameter_a', 'parameter_b']
        for parameter_name in parameter_names:
            self._create_example_parameter_with_name(parameter_name)
        self.assertEqual(
            sorted(registry.Registry.get_all_platform_parameter_names()),
            sorted(parameter_names))

    def test_memcache_is_set_after_getting(self) -> None:
        parameter_name = 'parameter_a'
        self._create_example_parameter_with_name(parameter_name)

        self.assertIsNone(
            registry.Registry.load_platform_parameter_from_memcache(
                parameter_name))
        registry.Registry.get_platform_parameter(parameter_name)
        self.assertIsNotNone(
            registry.Registry.load_platform_parameter_from_memcache(
                parameter_name))

    def test_update_parameter(self) -> None:
        parameter_name = 'parameter_a'
        self._create_example_parameter_with_name(parameter_name)

        registry.Registry.update_platform_parameter(
            parameter_name,
            feconf.SYSTEM_COMMITTER_ID,
            'commit message',
            [
                parameter_domain.PlatformParameterRule.from_dict({
                    'filters': [
                        {
                            'type': 'platform_type',
                            'conditions': [['=', 'Backend']]
                        }
                    ],
                    'value_when_matched': 'updated'
                })
            ],
            'default'
        )
        parameter_updated = registry.Registry.get_platform_parameter(
            parameter_name)

        self.assertEqual(parameter_updated.name, parameter_name)
        self.assertEqual(len(parameter_updated.rules), 1)
        self.assertEqual(
            parameter_updated.rules[0].value_when_matched, 'updated')

    def test_cached_value_is_invalidated_after_update(self) -> None:
        parameter_name = 'parameter_a'
        self._create_example_parameter_with_name(parameter_name)

        registry.Registry.update_platform_parameter(
            parameter_name,
            feconf.SYSTEM_COMMITTER_ID,
            'commit message',
            [
                parameter_domain.PlatformParameterRule.from_dict({
                    'filters': [
                        {
                            'type': 'platform_type',
                            'conditions': [['=', 'Backend']]
                        }
                    ],
                    'value_when_matched': 'updated'
                })
            ],
            'default'
        )
        self.assertIsNone(
            registry.Registry.load_platform_parameter_from_memcache(
                parameter_name))

    def test_update_parameter_with_invalid_rules_failure(self) -> None:
        parameter_name = 'parameter_a'
        self._create_example_parameter_with_name(parameter_name)

        param = registry.Registry.get_platform_parameter(parameter_name)
        param.validate()

        with self.assertRaisesRegex(
            utils.ValidationError, 'Expected string'):
            registry.Registry.update_platform_parameter(
                parameter_name,
                feconf.SYSTEM_COMMITTER_ID,
                'commit message',
                [
                    parameter_domain.PlatformParameterRule.from_dict({
                        'filters': [
                            {
                                'type': 'platform_type',
                                'conditions': [['=', 'Backend']]
                            }
                        ],
                        'value_when_matched': True
                    })
                ],
                'default'
            )

    def test_updated_parameter_is_saved_in_storage(self) -> None:
        parameter_name = 'parameter_a'
        self._create_example_parameter_with_name(parameter_name)
        self.assertIsNone(
            registry.Registry.load_platform_parameter_from_storage(
                parameter_name))

        registry.Registry.update_platform_parameter(
            parameter_name,
            feconf.SYSTEM_COMMITTER_ID,
            'commit message',
            [
                parameter_domain.PlatformParameterRule.from_dict({
                    'filters': [
                        {
                            'type': 'platform_type',
                            'conditions': [['=', 'Backend']]
                        }
                    ],
                    'value_when_matched': 'updated'
                })
            ],
            'default'
        )

        parameter_updated = (
            registry.Registry.load_platform_parameter_from_storage(
                parameter_name)
        )
        self.assertIsNotNone(parameter_updated)

    def test_default_value_return_from_parameter_registry_when_none_in_model(
        self
    ) -> None:
        def _mock_update_platform_parameter(
            name: str,
            committer_id: str,
            commit_message: str,
            new_rules: List[parameter_domain.PlatformParameterRule],
            default_value: parameter_domain.PlatformDataTypes
        ) -> None:
            param = registry.Registry.get_platform_parameter(name)

            new_rule_dicts = [rules.to_dict() for rules in new_rules]
            param_dict = param.to_dict()
            param_dict['rules'] = new_rule_dicts
            param_dict['default_value'] = default_value
            updated_param = param.from_dict(param_dict)
            updated_param.validate()

            model_instance = registry.Registry._to_platform_parameter_model( # pylint: disable=protected-access
                param)
            param.set_rules(new_rules)
            param.set_default_value(default_value)
            registry.Registry.parameter_registry[param.name] = param

            model_instance.rules = [rule.to_dict() for rule in param.rules]
            model_instance.default_value = None
            model_instance.commit(
                committer_id,
                commit_message,
                [{
                    'cmd': (
                        parameter_domain
                        .PlatformParameterChange.CMD_EDIT_RULES),
                    'new_rules': new_rule_dicts,
                    'default_value': None
                }]
            )

            caching_services.delete_multi(
                caching_services.CACHE_NAMESPACE_PLATFORM_PARAMETER,
                None,
                [name]
            )

        with self.swap(
            registry.Registry,
            'update_platform_parameter',
            _mock_update_platform_parameter
        ):
            parameter_name = 'parameter_b'
            self._create_example_parameter_with_name(parameter_name)
            registry.Registry.update_platform_parameter(
                parameter_name,
                feconf.SYSTEM_COMMITTER_ID,
                'commit message',
                [
                    parameter_domain.PlatformParameterRule.from_dict({
                        'filters': [
                            {
                                'type': 'platform_type',
                                'conditions': [['=', 'Backend']]
                            }
                        ],
                        'value_when_matched': 'updated'
                    })
                ],
                'default'
            )

            parameter_storage = (
                registry.Registry.load_platform_parameter_from_storage(
                    parameter_name)
            )

        self.assertIsNotNone(parameter_storage)
        assert parameter_storage is not None
        self.assertEqual(parameter_storage.default_value, 'default')

    def test_evaluate_all_parameters(self) -> None:
        context = parameter_domain.EvaluationContext.from_dict(
            {
                'platform_type': 'Web',
                'app_version': '1.2.3',
            },
            {
                'server_mode': FeatureStages.DEV,
            },
        )
        registry.Registry.init_platform_parameter_from_dict({
            'name': 'parameter_a',
            'description': 'for test',
            'data_type': DataTypes.STRING.value,
            'rules': [
                {
                    'filters': [
                        {
                            'type': 'platform_type',
                            'conditions': [['=', 'Web']]
                        }
                    ],
                    'value_when_matched': '222'
                }
            ],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'default_value': '333'
        })
        registry.Registry.init_platform_parameter_from_dict({
            'name': 'parameter_b',
            'description': 'for test',
            'data_type': DataTypes.BOOL.value,
            'rules': [],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'default_value': False
        })

        self.assertDictEqual(
            registry.Registry.evaluate_all_platform_parameters(context),
            {
                'parameter_a': '222',
                'parameter_b': False,
            }
        )
