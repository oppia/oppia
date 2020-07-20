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

"""Tests for the platform parameter domain classes."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import platform_parameter_domain as parameter_domain
from core.platform import models
from core.tests import test_utils
import feconf
import utils


(config_models,) = models.Registry.import_models(
    [models.NAMES.config])
memcache_services = models.Registry.import_memcache_services()


class PlatformParameterChangeTests(test_utils.GenericTestBase):
    """Test for the PlatformParameterChange."""

    VALID_CMD_NAME = (
        parameter_domain
        .PlatformParameterChange
        .CMD_REPLACE_PARAMETER_RULES)

    def test_param_change_object_with_missing_cmd_raises_exception(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Missing cmd key in change dict'):
            parameter_domain.PlatformParameterChange({'invalid': 'data'})

    def test_param_change_object_with_invalid_cmd_raises_exception(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Command invalid is not allowed'):
            parameter_domain.PlatformParameterChange({'cmd': 'invalid'})

    def test_param_change_object_missing_attribute_in_cmd_raises_exception(
            self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'The following required attributes are missing: '
                'new_rules')):
            parameter_domain.PlatformParameterChange({
                'cmd': self.VALID_CMD_NAME
            })

    def test_param_change_object_with_extra_attribute_in_cmd_raises_exception(
            self):
        with self.assertRaisesRegexp(
            utils.ValidationError, (
                'The following extra attributes are present: invalid')):
            parameter_domain.PlatformParameterChange({
                'cmd': self.VALID_CMD_NAME,
                'new_rules': [],
                'invalid': 'invalid'
            })

    def test_param_change_object_with_valid_data(self):
        param_change_object = (
            parameter_domain.PlatformParameterChange({
                'cmd': self.VALID_CMD_NAME,
                'new_rules': []
            }))

        self.assertEqual(
            param_change_object.cmd, self.VALID_CMD_NAME)
        self.assertEqual(
            param_change_object.new_rules, [])

    def test_to_dict(self):
        param_change_dict = {
            'cmd': self.VALID_CMD_NAME,
            'new_rules': []
        }
        param_change_object = (
            parameter_domain.PlatformParameterChange(
                param_change_dict))
        self.assertEqual(
            param_change_object.to_dict(),
            param_change_dict)


class EvaluationContextTest(test_utils.GenericTestBase):
    """Test for the EvaluationContext."""

    def test_create_feature_context_from_dict(self):
        context = parameter_domain.EvaluationContext.create_from_dict(
            client_context_dict={
                'client_platform': 'Android',
                'client_type': 'native',
                'browser_type': 'n/a',
                'app_version': '1.0.0',
                'user_locale': 'en-US',
            },
            server_context_dict={
                'mode': 'dev',
            },
        )
        self.assertEqual(context.client_platform, 'Android')
        self.assertEqual(context.client_type, 'native')
        self.assertEqual(context.browser_type, 'n/a')
        self.assertEqual(context.app_version, '1.0.0')
        self.assertEqual(context.user_locale, 'en-US')
        self.assertEqual(context.mode, 'dev')

    def test_raise_exception_with_invalid_dict(self):
        with self.assertRaises(Exception):
            parameter_domain.EvaluationContext.create_from_dict(
                client_context_dict={},
                server_context_dict={}
            )


class PlatformParameterFilterTest(test_utils.GenericTestBase):
    """Test for the PlatformParameterFilter."""

    def create_example_context(
            self, client_platform='Android',
            client_type='native', browser_type='n/a', app_version='1.2.3',
            user_locale='en-US', mode='dev'):
        """not ready."""
        return parameter_domain.EvaluationContext.create_from_dict(
            client_context_dict={
                'client_platform': client_platform,
                'client_type': client_type,
                'browser_type': browser_type,
                'app_version': app_version,
                'user_locale': user_locale,
            },
            server_context_dict={
                'mode': mode,
            },
        )

    def test_create_filter_from_dict(self):
        filter_dict = {'type': 'app_version', 'value': '1.2.3'}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.create_from_dict(filter_dict))

        filter_domain.validate()

        self.assertEqual(filter_domain.type, 'app_version')
        self.assertEqual(filter_domain.value, '1.2.3')

    def test_filter_to_dict(self):
        filter_dict = {'type': 'app_version', 'value': '1.2.3'}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.create_from_dict(filter_dict))

        self.assertEqual(filter_domain.to_dict(), filter_dict)

    def test_mode_filter(self):
        filter_dict = {'type': 'mode', 'value': 'dev'}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.create_from_dict(filter_dict))

        dev_context = self.create_example_context(mode='dev')
        prod_context = self.create_example_context(mode='prod')

        self.assertTrue(filter_domain.evaluate(dev_context))
        self.assertFalse(filter_domain.evaluate(prod_context))

    def test_user_locale_filter(self):
        filter_dict = {'type': 'user_locale', 'value': 'en-US'}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.create_from_dict(filter_dict))

        en_context = self.create_example_context(user_locale='en-US')
        zh_context = self.create_example_context(user_locale='zh-CN')

        self.assertTrue(filter_domain.evaluate(en_context))
        self.assertFalse(filter_domain.evaluate(zh_context))

    def test_client_platform_filter(self):
        filter_dict = {'type': 'client_platform', 'value': 'Linux'}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.create_from_dict(filter_dict))

        linux_context = self.create_example_context(client_platform='Linux')
        windows_context = self.create_example_context(client_platform='Windows')

        self.assertTrue(filter_domain.evaluate(linux_context))
        self.assertFalse(filter_domain.evaluate(windows_context))

    def test_client_type_filter(self):
        filter_dict = {'type': 'client_type', 'value': 'web'}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.create_from_dict(filter_dict))

        web_context = self.create_example_context(client_type='web')
        native_context = self.create_example_context(client_type='native')

        self.assertTrue(filter_domain.evaluate(web_context))
        self.assertFalse(filter_domain.evaluate(native_context))

    def test_browser_type_filter(self):
        filter_dict = {'type': 'browser_type', 'value': 'Chrome'}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.create_from_dict(filter_dict))

        chrome_context = self.create_example_context(browser_type='Chrome')
        firefox_context = self.create_example_context(browser_type='Firefox')

        self.assertTrue(filter_domain.evaluate(chrome_context))
        self.assertFalse(filter_domain.evaluate(firefox_context))

    def test_app_version_filter(self):
        filter_dict = {'type': 'app_version', 'value': '1.2.3'}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.create_from_dict(filter_dict))

        true_context = self.create_example_context(app_version='1.2.3')
        false_context = self.create_example_context(app_version='1.2.4')

        self.assertTrue(filter_domain.evaluate(true_context))
        self.assertFalse(filter_domain.evaluate(false_context))

    def test_app_version_filter_with_eq_comparison(self):
        filter_dict = {'type': 'app_version', 'value': '1.2.3'}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.create_from_dict(filter_dict))
        self.assertTrue(filter_domain.evaluate(
            self.create_example_context(app_version='1.2.3')))
        self.assertFalse(filter_domain.evaluate(
            self.create_example_context(app_version='1.2.4')))

        filter_dict = {'type': 'app_version', 'value': '=1.2.3'}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.create_from_dict(filter_dict))
        self.assertTrue(filter_domain.evaluate(
            self.create_example_context(app_version='1.2.3')))
        self.assertFalse(filter_domain.evaluate(
            self.create_example_context(app_version='1.2.4')))

    def test_app_version_filter_with_gt_comparison(self):
        filter_dict = {'type': 'app_version', 'value': '>1.2.3'}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.create_from_dict(filter_dict))
        self.assertFalse(filter_domain.evaluate(
            self.create_example_context(app_version='1.1.2')))
        self.assertFalse(filter_domain.evaluate(
            self.create_example_context(app_version='1.2.3')))
        self.assertTrue(filter_domain.evaluate(
            self.create_example_context(app_version='1.2.4')))

    def test_app_version_filter_with_gte_comparison(self):
        filter_dict = {'type': 'app_version', 'value': '>=1.2.3'}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.create_from_dict(filter_dict))
        self.assertFalse(filter_domain.evaluate(
            self.create_example_context(app_version='1.1.2')))
        self.assertTrue(filter_domain.evaluate(
            self.create_example_context(app_version='1.2.3')))
        self.assertTrue(filter_domain.evaluate(
            self.create_example_context(app_version='1.2.4')))

    def test_app_version_filter_with_lt_comparison(self):
        filter_dict = {'type': 'app_version', 'value': '<1.2.3'}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.create_from_dict(filter_dict))
        self.assertTrue(filter_domain.evaluate(
            self.create_example_context(app_version='1.1.2')))
        self.assertFalse(filter_domain.evaluate(
            self.create_example_context(app_version='1.2.3')))
        self.assertFalse(filter_domain.evaluate(
            self.create_example_context(app_version='1.2.4')))

    def test_app_version_filter_with_lte_comparison(self):
        filter_dict = {'type': 'app_version', 'value': '<=1.2.3'}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.create_from_dict(filter_dict))
        self.assertTrue(filter_domain.evaluate(
            self.create_example_context(app_version='1.1')))
        self.assertTrue(filter_domain.evaluate(
            self.create_example_context(app_version='1.2.3')))
        self.assertFalse(filter_domain.evaluate(
            self.create_example_context(app_version='1.2.4')))

    def test_app_version_filter_with_invalid_expr(self):
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.create_from_dict(
                {'type': 'app_version', 'value': '1.a.2'}
            ))
        self.assertFalse(filter_domain.evaluate(
            self.create_example_context(app_version='1.3.2')
        ))

        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid version expression'):
            filter_domain.validate()

        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid version expression'):
            filter_domain = (
                parameter_domain
                .PlatformParameterFilter.create_from_dict(
                    {'type': 'app_version', 'value': 'x1.2.3'}
                ))
            filter_domain.validate()

    def test_filter_with_invalid_type(self):
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.create_from_dict(
                {'type': 'invalid', 'value': 'value1'}
            ))
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Unsupported filter type'):
            filter_domain.validate()

    def test_filter_with_multiple_values(self):
        filter_dict = {'type': 'mode', 'value': ['dev', 'prod']}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.create_from_dict(filter_dict))
        filter_domain.validate()

        dev_context = self.create_example_context(mode='dev')
        test_context = self.create_example_context(mode='test')
        prod_context = self.create_example_context(mode='prod')

        self.assertTrue(filter_domain.evaluate(dev_context))
        self.assertTrue(filter_domain.evaluate(prod_context))
        self.assertFalse(filter_domain.evaluate(test_context))

    def test_app_version_filter_with_multiple_values(self):
        filter_dict = {'type': 'app_version', 'value': ['1.2.3', '1.2.4']}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.create_from_dict(filter_dict))
        filter_domain.validate()

        self.assertTrue(filter_domain.evaluate(
            self.create_example_context(app_version='1.2.3')))
        self.assertTrue(filter_domain.evaluate(
            self.create_example_context(app_version='1.2.4')))
        self.assertFalse(filter_domain.evaluate(
            self.create_example_context(app_version='1.5.3')))

    def test_app_version_filter_with_no_version_in_context(self):
        filter_dict = {'type': 'app_version', 'value': ['1.2.3', '1.2.4']}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.create_from_dict(filter_dict))

        self.assertFalse(filter_domain.evaluate(
            self.create_example_context(app_version=None)))


class PlatformParameterRuleTest(test_utils.GenericTestBase):
    """Test for the PlatformParameterRule."""

    def test_create_from_dict(self):
        filters = [{'type': 'app_version', 'value': '=1.2.3'}]
        rule = parameter_domain.PlatformParameterRule.create_from_dict({
            'filters': filters,
            'value_when_matched': False,
        })
        self.assertIsInstance(rule, parameter_domain.PlatformParameterRule)

        filter_domain = rule.filters[0]
        self.assertIsInstance(
            filter_domain, parameter_domain.PlatformParameterFilter)
        self.assertEqual(len(rule.filters), 1)
        self.assertEqual(filter_domain.type, 'app_version')
        self.assertEqual(filter_domain.value, '=1.2.3')
        self.assertEqual(rule.value_when_matched, False)

    def test_to_dict(self):
        rule_dict = {
            'filters': [{'type': 'app_version', 'value': '1.2.3'}],
            'value_when_matched': False,
        }
        rule = parameter_domain.PlatformParameterRule.create_from_dict(
            rule_dict)
        self.assertEqual(rule.to_dict(), rule_dict)

    def test_has_mode_filter(self):
        rule = parameter_domain.PlatformParameterRule.create_from_dict({
            'filters': [{'type': 'app_version', 'value': '1.2.3'}],
            'value_when_matched': False,
        })
        self.assertFalse(rule.has_mode_filter())

        rule = parameter_domain.PlatformParameterRule.create_from_dict({
            'filters': [{'type': 'mode', 'value': 'dev'}],
            'value_when_matched': False,
        })
        self.assertTrue(rule.has_mode_filter())

    def test_evaluation_matched(self):
        rule = parameter_domain.PlatformParameterRule.create_from_dict({
            'filters': [
                {'type': 'app_version', 'value': '1.2.3'},
                {'type': 'user_locale', 'value': 'en-US'},
            ],
            'value_when_matched': 'matched_val',
        })
        context = parameter_domain.EvaluationContext.create_from_dict(
            client_context_dict={
                'client_platform': 'Android',
                'client_type': 'native',
                'browser_type': 'n/a',
                'app_version': '1.2.3',
                'user_locale': 'en-US',
            },
            server_context_dict={
                'mode': 'dev',
            },
        )
        matched, val = rule.evaluate(context)
        self.assertTrue(matched)
        self.assertEqual(val, 'matched_val')

    def test_evaluation_not_matched(self):
        rule = parameter_domain.PlatformParameterRule.create_from_dict({
            'filters': [
                {'type': 'app_version', 'value': '1.2.3'},
                {'type': 'user_locale', 'value': 'en-UK'},
            ],
            'value_when_matched': 'matched_val',
        })
        context = parameter_domain.EvaluationContext.create_from_dict(
            client_context_dict={
                'client_platform': 'Android',
                'client_type': 'native',
                'browser_type': 'n/a',
                'app_version': '1.2.3',
                'user_locale': 'en-US',
            },
            server_context_dict={
                'mode': 'dev',
            },
        )
        matched, val = rule.evaluate(context)
        self.assertFalse(matched)
        self.assertIsNone(val)

    def test_validate_each_filter(self):
        filters = [
            {'type': 'app_version', 'value': '=1.2.3'},
            {'type': 'invalid', 'value': '=1.2.3'},
        ]
        rule = parameter_domain.PlatformParameterRule.create_from_dict({
            'filters': filters,
            'value_when_matched': False,
        })
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Unsupported filter type'):
            rule.validate()


class PlatformParameterMetadataTest(test_utils.GenericTestBase):
    """Test for the PlatformParameterMetadata."""

    def test_create_from_dict(self):
        metadata = parameter_domain.PlatformParameterMetadata.create_from_dict(
            {'is_feature': True, 'stage': 'dev'})

        self.assertTrue(metadata.is_feature)
        self.assertEqual(metadata.stage, 'dev')

    def test_create_with_default_value(self):
        metadata = parameter_domain.PlatformParameterMetadata.create_from_dict(
            {})

        self.assertFalse(metadata.is_feature)
        self.assertIsNone(metadata.stage)

    def test_to_dict(self):
        metadata_dict = {
            'is_feature': True,
            'stage': 'dev',
        }
        metadata = parameter_domain.PlatformParameterMetadata.create_from_dict(
            metadata_dict)

        self.assertDictEqual(metadata.to_dict(), metadata_dict)


class PlatformParameterTest(test_utils.GenericTestBase):
    """Test for the PlatformParameter."""

    def test_create_from_dict(self):
        parameter = parameter_domain.PlatformParameter.create_from_dict({
            'name': 'parameter_a',
            'description': 'for test',
            'data_type': 'string',
            'rules': [
                {
                    'filters': [
                        {
                            'type': 'mode',
                            'value': 'dev'
                        }
                    ],
                    'value_when_matched': '222'
                },
                {
                    'filters': [],
                    'value_when_matched': '111'
                }
            ]
        })

        self.assertIsInstance(parameter, parameter_domain.PlatformParameter)
        self.assertEqual(parameter.name, 'parameter_a')
        self.assertEqual(parameter.description, 'for test')
        self.assertEqual(parameter.data_type, 'string')
        self.assertEqual(len(parameter.rules), 2)
        self.assertIsInstance(
            parameter.metadata, parameter_domain.PlatformParameterMetadata)

    def test_validate_last_default_rule(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'must not have any filter'):
            parameter = parameter_domain.PlatformParameter.create_from_dict({
                'name': 'parameter_a',
                'description': 'for test',
                'data_type': 'string',
                'rules': [
                    {
                        'filters': [
                            {
                                'type': 'mode',
                                'value': 'dev'
                            }
                        ],
                        'value_when_matched': '222'
                    },
                ],
            })
            parameter.validate()

    def test_validate_data_type_not_supported(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Unsupported data type'):
            parameter = parameter_domain.PlatformParameter.create_from_dict({
                'name': 'parameter_a',
                'description': 'for test',
                'data_type': 'InvalidType',
                'rules': [
                    {
                        'filters': [
                            {
                                'type': 'mode',
                                'value': 'dev'
                            }
                        ],
                        'value_when_matched': '222'
                    },
                    {
                        'filters': [],
                        'value_when_matched': '111'
                    }
                ],
            })
            parameter.validate()

    def test_validate_consistent_data_type_in_rules(self):
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected bool'):
            parameter = parameter_domain.PlatformParameter.create_from_dict({
                'name': 'parameter_a',
                'description': 'for test',
                'data_type': 'bool',
                'rules': [
                    {
                        'filters': [
                            {
                                'type': 'mode',
                                'value': 'dev'
                            }
                        ],
                        'value_when_matched': '222'
                    },
                    {
                        'filters': [],
                        'value_when_matched': '111'
                    }
                ],
            })
            parameter.validate()

    def test_to_dict(self):
        para_dict = {
            'name': 'parameter_a',
            'description': 'for test',
            'data_type': 'string',
            'rules': [
                {
                    'filters': [
                        {
                            'type': 'mode',
                            'value': 'dev'
                        }
                    ],
                    'value_when_matched': '222'
                },
                {
                    'filters': [],
                    'value_when_matched': '111'
                }
            ],
            'metadata': {
                'is_feature': False,
                'stage': None
            }
        }
        parameter = parameter_domain.PlatformParameter.create_from_dict(
            para_dict)
        self.assertDictEqual(parameter.to_dict(), para_dict)

    def test_evaluate(self):
        parameter = parameter_domain.PlatformParameter.create_from_dict({
            'name': 'parameter_a',
            'description': 'for test',
            'data_type': 'string',
            'rules': [
                {
                    'filters': [
                        {
                            'type': 'mode',
                            'value': 'dev'
                        }
                    ],
                    'value_when_matched': '222'
                },
                {
                    'filters': [],
                    'value_when_matched': '111'
                }
            ],
        })

        dev_context = parameter_domain.EvaluationContext.create_from_dict(
            client_context_dict={
                'client_platform': 'Android',
                'client_type': 'native',
                'browser_type': 'n/a',
                'app_version': '1.2.3',
                'user_locale': 'en-US',
            },
            server_context_dict={
                'mode': 'dev',
            },
        )
        self.assertEqual(parameter.evaluate(dev_context), '222')

        prod_context = parameter_domain.EvaluationContext.create_from_dict(
            client_context_dict={
                'client_platform': 'Android',
                'client_type': 'native',
                'browser_type': 'n/a',
                'app_version': '1.2.3',
                'user_locale': 'en-US',
            },
            server_context_dict={
                'mode': 'prod',
            },
        )
        self.assertEqual(parameter.evaluate(prod_context), '111')

    def test_validate_correct_feature_flags(self):
        parameter = parameter_domain.PlatformParameter.create_from_dict({
            'name': 'parameter_a',
            'description': 'for test',
            'data_type': 'bool',
            'rules': [
                {
                    'filters': [{'type': 'mode', 'value': 'dev'}],
                    'value_when_matched': False
                },
                {
                    'filters': [],
                    'value_when_matched': False
                }
            ],
            'metadata': {
                'is_feature': True,
                'stage': 'dev',
            }
        })
        parameter.validate()

    def test_validate_feature_flags_with_invalid_type(self):
        parameter = parameter_domain.PlatformParameter.create_from_dict({
            'name': 'parameter_a',
            'description': 'for test',
            'data_type': 'string',
            'rules': [
                {
                    'filters': [],
                    'value_when_matched': '111'
                }
            ],
            'metadata': {
                'is_feature': True,
                'stage': 'dev',
            }
        })
        with self.assertRaisesRegexp(
            utils.ValidationError, 'must be bool'):
            parameter.validate()

    def test_validate_feature_flags_with_invalid_stage(self):
        parameter = parameter_domain.PlatformParameter.create_from_dict({
            'name': 'parameter_a',
            'description': 'for test',
            'data_type': 'bool',
            'rules': [
                {
                    'filters': [],
                    'value_when_matched': False
                }
            ],
            'metadata': {
                'is_feature': True,
                'stage': 'Invalid',
            }
        })
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid feature stage'):
            parameter.validate()

    def test_validate_feature_flags_with_no_mode_filter(self):
        parameter = parameter_domain.PlatformParameter.create_from_dict({
            'name': 'parameter_a',
            'description': 'for test',
            'data_type': 'bool',
            'rules': [
                {
                    'filters': [],
                    'value_when_matched': True
                }
            ],
            'metadata': {
                'is_feature': True,
                'stage': 'dev',
            }
        })
        with self.assertRaisesRegexp(
            utils.ValidationError, 'must have a mode filter'):
            parameter.validate()

    def test_validate_dev_feature_flags_enabled_for_inappropriate_env(self):
        parameter = parameter_domain.PlatformParameter.create_from_dict({
            'name': 'parameter_a',
            'description': 'for test',
            'data_type': 'bool',
            'rules': [
                {
                    'filters': [
                        {'type': 'mode', 'value': 'test'}],
                    'value_when_matched': True
                },
                {
                    'filters': [],
                    'value_when_matched': False
                }
            ],
            'metadata': {
                'is_feature': True,
                'stage': 'dev',
            }
        })
        with self.assertRaisesRegexp(
            utils.ValidationError, 'cannot be enabled in test'):
            parameter.validate()

    def test_validate_test_feature_flags_enabled_for_inappropriate_env(self):
        parameter = parameter_domain.PlatformParameter.create_from_dict({
            'name': 'parameter_a',
            'description': 'for test',
            'data_type': 'bool',
            'rules': [
                {
                    'filters': [
                        {'type': 'mode', 'value': 'prod'}],
                    'value_when_matched': True
                },
                {
                    'filters': [],
                    'value_when_matched': False
                }
            ],
            'metadata': {
                'is_feature': True,
                'stage': 'test',
            }
        })
        with self.assertRaisesRegexp(
            utils.ValidationError, 'cannot be enabled in production'):
            parameter.validate()

    def test_update(self):
        parameter = parameter_domain.PlatformParameter.create_from_dict({
            'name': 'parameter_a',
            'description': 'for test',
            'data_type': 'string',
            'rules': [
                {
                    'filters': [
                        {
                            'type': 'mode',
                            'value': 'dev'
                        }
                    ],
                    'value_when_matched': '222'
                },
                {
                    'filters': [],
                    'value_when_matched': '111'
                }
            ],
        })
        parameter.validate()

        self.assertEqual(len(parameter.rules), 2)
        self.assertIsNone(config_models.PlatformParameterModel.get(
            parameter.name, strict=False))
        parameter.update(
            committer_id=feconf.SYSTEM_COMMITTER_ID,
            commit_message='commit message',
            new_rule_dicts=[{'filters': [], 'value_when_matched': '333'}]
        )
        self.assertEqual(len(parameter.rules), 1)
        self.assertIsNotNone(config_models.PlatformParameterModel.get(
            parameter.name, strict=False))

    def test_update_with_validation_error(self):
        parameter = parameter_domain.PlatformParameter.create_from_dict({
            'name': 'parameter_a',
            'description': 'for test',
            'data_type': 'string',
            'rules': [
                {
                    'filters': [
                        {
                            'type': 'mode',
                            'value': 'dev'
                        }
                    ],
                    'value_when_matched': '222'
                },
                {
                    'filters': [],
                    'value_when_matched': '111'
                }
            ],
        })
        parameter.validate()

        with self.assertRaisesRegexp(
            utils.ValidationError, 'Expected string'):
            parameter.update(
                committer_id=feconf.SYSTEM_COMMITTER_ID,
                commit_message='commit message',
                new_rule_dicts=[{'filters': [], 'value_when_matched': False}]
            )


class PlatformParameterRegistryTests(test_utils.GenericTestBase):
    """Tests for the platform parameter Registry."""

    def setUp(self):
        super(PlatformParameterRegistryTests, self).setUp()
        parameter_domain.Registry.parameter_registry.clear()

        # Parameter names that might be used in following tests.
        parameter_names = ['parameter_a', 'parameter_b']
        memcache_keys = [
            parameter_domain.PlatformParameter.get_memcache_key(name)
            for name in parameter_names]
        memcache_services.delete_multi(memcache_keys)

    def create_example_parameter_with_name(self, name):
        """not ready."""
        parameter_domain.Registry.create_platform_parameter_from_dict({
            'name': name,
            'description': 'for test',
            'data_type': 'string',
            'rules': [
                {
                    'filters': [
                        {
                            'type': 'mode',
                            'value': 'dev'
                        }
                    ],
                    'value_when_matched': '222'
                },
                {
                    'filters': [],
                    'value_when_matched': '111'
                }
            ],
        })

    def test_create_platform_parameter(self):
        parameter = parameter_domain.Registry.create_platform_parameter(
            name='parameter_a',
            description='test',
            data_type='bool'
        )
        self.assertIsInstance(parameter, parameter_domain.PlatformParameter)
        parameter.validate()

    def test_create_platform_parameter_with_invalid_type(self):
        with self.assertRaisesRegexp(
            Exception, 'Unsupported data type'):
            parameter = parameter_domain.Registry.create_platform_parameter(
                name='parameter_a',
                description='test',
                data_type='Invalid'
            )

    def test_default_value_of_bool_platform_parameter(self):
        parameter = parameter_domain.Registry.create_platform_parameter(
            name='parameter_a',
            description='test',
            data_type='bool'
        )
        parameter.validate()
        self.assertEqual(parameter.rules[0].value_when_matched, False)

    def test_default_value_of_string_platform_parameter(self):
        parameter = parameter_domain.Registry.create_platform_parameter(
            name='parameter_a',
            description='test',
            data_type='string'
        )
        parameter.validate()
        self.assertEqual(parameter.rules[0].value_when_matched, '')

    def test_default_value_of_int_platform_parameter(self):
        parameter = parameter_domain.Registry.create_platform_parameter(
            name='parameter_a',
            description='test',
            data_type='number'
        )
        parameter.validate()
        self.assertEqual(parameter.rules[0].value_when_matched, 0)

    def test_create_and_get_platform_parameter(self):
        parameter_name = 'parameter_a'
        self.create_example_parameter_with_name(parameter_name)
        parameter = parameter_domain.Registry.get_platform_parameter(
            parameter_name)
        self.assertIsNotNone(parameter)
        self.assertIsInstance(parameter, parameter_domain.PlatformParameter)
        # Get from memcache.
        self.assertIsNotNone(
            parameter_domain.Registry.get_platform_parameter(
                parameter_name))

    def test_create_platform_parameter_with_the_same_name(self):
        parameter_name = 'parameter_a'
        self.create_example_parameter_with_name(parameter_name)
        with self.assertRaisesRegexp(Exception, 'already exists'):
            self.create_example_parameter_with_name(parameter_name)

    def test_get_non_existing_parameter(self):
        with self.assertRaisesRegexp(Exception, 'not found'):
            parameter_domain.Registry.get_platform_parameter('parameter_a')

    def test_get_all_parameter_names(self):
        parameter_names = ['parameter_a', 'parameter_b']
        for parameter_name in parameter_names:
            self.create_example_parameter_with_name(parameter_name)
        self.assertEqual(
            sorted(
                parameter_domain.Registry.get_all_platform_parameter_names()),
            sorted(parameter_names))

    def test_memcache_is_set_after_getting(self):
        parameter_name = 'parameter_a'
        self.create_example_parameter_with_name(parameter_name)

        self.assertIsNone(
            parameter_domain.Registry.load_platform_parameter_from_memcache(
                parameter_name))
        parameter_domain.Registry.get_platform_parameter(parameter_name)
        self.assertIsNotNone(
            parameter_domain.Registry.load_platform_parameter_from_memcache(
                parameter_name))

    def test_update_parameter(self):
        parameter_name = 'parameter_a'
        self.create_example_parameter_with_name(parameter_name)

        parameter_domain.Registry.update_platform_parameter(
            parameter_name,
            feconf.SYSTEM_COMMITTER_ID,
            'commit message',
            [{'filters': [], 'value_when_matched': 'updated'}],
        )
        # Cache is invalidated after update.
        self.assertIsNone(
            parameter_domain.Registry.load_platform_parameter_from_memcache(
                parameter_name))
        parameter_updated = parameter_domain.Registry.get_platform_parameter(
            parameter_name)

        self.assertEqual(parameter_updated.name, parameter_name)
        self.assertEqual(len(parameter_updated.rules), 1)
        self.assertEqual(
            parameter_updated.rules[0].value_when_matched, 'updated')

        self.assertIsNotNone(
            parameter_domain.Registry.load_platform_parameter_from_memcache(
                parameter_name))

    def test_updated_parameter_is_saved_in_storage(self):
        parameter_name = 'parameter_a'
        self.create_example_parameter_with_name(parameter_name)
        self.assertIsNone(
            parameter_domain.Registry.load_platform_parameter_from_storage(
                parameter_name))

        parameter_domain.Registry.update_platform_parameter(
            parameter_name,
            feconf.SYSTEM_COMMITTER_ID,
            'commit message',
            [{'filters': [], 'value_when_matched': 'updated'}],
        )

        parameter_updated = (
            parameter_domain
            .Registry
            .load_platform_parameter_from_storage(parameter_name)
        )
        self.assertIsNotNone(parameter_updated)

    def test_evaluate_all_parameters(self):
        context = parameter_domain.EvaluationContext.create_from_dict(
            client_context_dict={
                'client_platform': 'Android',
                'client_type': 'native',
                'browser_type': 'n/a',
                'app_version': '1.2.3',
                'user_locale': 'en-US',
            },
            server_context_dict={
                'mode': 'dev',
            },
        )
        parameter_domain.Registry.create_platform_parameter_from_dict({
            'name': 'parameter_a',
            'description': 'for test',
            'data_type': 'string',
            'rules': [
                {
                    'filters': [
                        {
                            'type': 'mode',
                            'value': 'dev'
                        }
                    ],
                    'value_when_matched': '222'
                },
                {
                    'filters': [],
                    'value_when_matched': '111'
                }
            ],
            'metadata': {
                'is_feature': True,
                'stage': 'in-dev',
            }
        })
        parameter_domain.Registry.create_platform_parameter_from_dict({
            'name': 'parameter_b',
            'description': 'for test',
            'data_type': 'bool',
            'rules': [
                {
                    'filters': [],
                    'value_when_matched': False
                }
            ],
            'metadata': {
            }
        })

        self.assertDictEqual(
            parameter_domain.Registry.evaluate_all_platform_parameters(context),
            {
                'parameter_a': '222',
                'parameter_b': False,
            }
        )
