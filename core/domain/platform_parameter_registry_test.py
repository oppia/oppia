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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import caching_services
from core.domain import platform_parameter_domain as parameter_domain
from core.domain import platform_parameter_registry as registry
from core.platform import models
from core.tests import test_utils
import feconf
import utils


(config_models,) = models.Registry.import_models(
    [models.NAMES.config])

DATA_TYPES = parameter_domain.DATA_TYPES # pylint: disable=invalid-name
FEATURE_STAGES = parameter_domain.FEATURE_STAGES # pylint: disable=invalid-name


class PlatformParameterRegistryTests(test_utils.GenericTestBase):
    """Tests for the platform parameter Registry."""

    def setUp(self):
        super(PlatformParameterRegistryTests, self).setUp()

        self.original_param_registry = registry.Registry.parameter_registry
        registry.Registry.parameter_registry.clear()

        # Parameter names that might be used in following tests.
        parameter_names = ('parameter_a', 'parameter_b')
        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_PLATFORM_PARAMETER, None,
            parameter_names)

    def tearDown(self):
        super(PlatformParameterRegistryTests, self).tearDown()

        registry.Registry.parameter_registry = self.original_param_registry

    def _create_example_parameter_with_name(self, name):
        """Creates and returns an example parameter with the given name."""
        registry.Registry.init_platform_parameter_from_dict({
            'name': name,
            'description': 'for test',
            'data_type': DATA_TYPES.string,
            'rules': [
                {
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [('=', FEATURE_STAGES.dev)]
                        }
                    ],
                    'value_when_matched': '222'
                }
            ],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'default_value': '111',
            'is_feature': False,
            'feature_stage': None,
        })

    def test_create_platform_parameter(self):
        parameter = registry.Registry.create_platform_parameter(
            'parameter_a', 'test', registry.DATA_TYPES.bool)
        self.assertIsInstance(parameter, parameter_domain.PlatformParameter)
        parameter.validate()

    def test_create_platform_parameter_with_invalid_type_failure(self):
        with self.assertRaisesRegexp(
            Exception, 'Unsupported data type \'Invalid\''):
            registry.Registry.create_platform_parameter(
                'parameter_a', 'test', 'Invalid')

    def test_create_platform_parameter_with_the_same_name_failure(self):
        param_name = 'parameter_a'
        self._create_example_parameter_with_name(param_name)
        with self.assertRaisesRegexp(
            Exception, 'Parameter with name %s already exists' % param_name):
            self._create_example_parameter_with_name(param_name)

    def test_create_feature_flag(self):
        feature = registry.Registry.create_feature_flag(
            'parameter_a', 'test feature', FEATURE_STAGES.dev)
        self.assertEqual(feature.data_type, registry.DATA_TYPES.bool)
        self.assertTrue(feature.is_feature)
        self.assertEqual(feature.feature_stage, FEATURE_STAGES.dev)
        feature.validate()

    def test_default_value_of_bool_platform_parameter(self):
        parameter = registry.Registry.create_platform_parameter(
            'parameter_a', 'test feature', registry.DATA_TYPES.bool)
        parameter.validate()
        self.assertEqual(parameter.default_value, False)

    def test_default_value_of_string_platform_parameter(self):
        parameter = registry.Registry.create_platform_parameter(
            'parameter_a', 'test', DATA_TYPES.string)
        parameter.validate()
        self.assertEqual(parameter.default_value, '')

    def test_default_value_of_number_platform_parameter(self):
        parameter = registry.Registry.create_platform_parameter(
            'parameter_a', 'test', DATA_TYPES.number)
        parameter.validate()
        self.assertEqual(parameter.default_value, 0)

    def test_get_platform_parameter(self):
        parameter_name = 'parameter_a'
        self._create_example_parameter_with_name(parameter_name)
        parameter = registry.Registry.get_platform_parameter(parameter_name)
        self.assertIsNotNone(parameter)
        self.assertIsInstance(parameter, parameter_domain.PlatformParameter)

    def test_get_non_existing_parameter_failure(self):
        with self.assertRaisesRegexp(Exception, 'not found'):
            registry.Registry.get_platform_parameter('parameter_a')

    def test_get_all_parameter_names(self):
        parameter_names = ['parameter_a', 'parameter_b']
        for parameter_name in parameter_names:
            self._create_example_parameter_with_name(parameter_name)
        self.assertEqual(
            sorted(registry.Registry.get_all_platform_parameter_names()),
            sorted(parameter_names))

    def test_memcache_is_set_after_getting(self):
        parameter_name = 'parameter_a'
        self._create_example_parameter_with_name(parameter_name)

        self.assertIsNone(
            registry.Registry.load_platform_parameter_from_memcache(
                parameter_name))
        registry.Registry.get_platform_parameter(parameter_name)
        self.assertIsNotNone(
            registry.Registry.load_platform_parameter_from_memcache(
                parameter_name))

    def test_update_parameter(self):
        parameter_name = 'parameter_a'
        self._create_example_parameter_with_name(parameter_name)

        registry.Registry.update_platform_parameter(
            parameter_name,
            feconf.SYSTEM_COMMITTER_ID,
            'commit message',
            [
                {
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [('=', FEATURE_STAGES.dev)]
                        }
                    ],
                    'value_when_matched': 'updated'
                }
            ],
        )
        parameter_updated = registry.Registry.get_platform_parameter(
            parameter_name)

        self.assertEqual(parameter_updated.name, parameter_name)
        self.assertEqual(len(parameter_updated.rules), 1)
        self.assertEqual(
            parameter_updated.rules[0].value_when_matched, 'updated')

    def test_cached_value_is_invalidated_after_update(self):
        parameter_name = 'parameter_a'
        self._create_example_parameter_with_name(parameter_name)

        registry.Registry.update_platform_parameter(
            parameter_name,
            feconf.SYSTEM_COMMITTER_ID,
            'commit message',
            [
                {
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [('=', FEATURE_STAGES.dev)]
                        }
                    ],
                    'value_when_matched': 'updated'
                }
            ],
        )
        self.assertIsNone(
            registry.Registry.load_platform_parameter_from_memcache(
                parameter_name))

    def test_update_parameter_with_invalid_rules_failure(self):
        parameter_name = 'parameter_a'
        self._create_example_parameter_with_name(parameter_name)

        param = registry.Registry.get_platform_parameter(parameter_name)
        param.validate()

        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected string'):
            registry.Registry.update_platform_parameter(
                parameter_name,
                feconf.SYSTEM_COMMITTER_ID,
                'commit message',
                [
                    {
                        'filters': [
                            {
                                'type': 'server_mode',
                                'conditions': [('=', FEATURE_STAGES.dev)]
                            }
                        ],
                        'value_when_matched': True
                    }
                ],
            )

    def test_updated_parameter_is_saved_in_storage(self):
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
                {
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [('=', FEATURE_STAGES.dev)]
                        }
                    ],
                    'value_when_matched': 'updated'
                }
            ],
        )

        parameter_updated = (
            registry.Registry.load_platform_parameter_from_storage(
                parameter_name)
        )
        self.assertIsNotNone(parameter_updated)

    def test_evaluate_all_parameters(self):
        context = parameter_domain.EvaluationContext.from_dict(
            {
                'client_type': 'Android',
                'browser_type': None,
                'app_version': '1.2.3',
                'user_locale': 'en',
            },
            {
                'server_mode': FEATURE_STAGES.dev,
            },
        )
        registry.Registry.init_platform_parameter_from_dict({
            'name': 'parameter_a',
            'description': 'for test',
            'data_type': DATA_TYPES.string,
            'rules': [
                {
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [('=', FEATURE_STAGES.dev)]
                        }
                    ],
                    'value_when_matched': '222'
                }
            ],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'default_value': '333',
            'is_feature': True,
            'feature_stage': FEATURE_STAGES.dev,
        })
        registry.Registry.init_platform_parameter_from_dict({
            'name': 'parameter_b',
            'description': 'for test',
            'data_type': registry.DATA_TYPES.bool,
            'rules': [],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'default_value': False,
            'is_feature': False,
            'feature_stage': None,
        })

        self.assertDictEqual(
            registry.Registry.evaluate_all_platform_parameters(context),
            {
                'parameter_a': '222',
                'parameter_b': False,
            }
        )
