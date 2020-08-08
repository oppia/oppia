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

"""Tests for the domain objects relating to platform parameters."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

from core.domain import platform_parameter_domain as parameter_domain
from core.tests import test_utils
import feconf
import utils


class PlatformParameterChangeTests(test_utils.GenericTestBase):
    """Test for the PlatformParameterChange class."""

    CMD_EDIT_RULES = parameter_domain.PlatformParameterChange.CMD_EDIT_RULES

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
            utils.ValidationError,
            'The following required attributes are missing: new_rules'):
            parameter_domain.PlatformParameterChange({
                'cmd': self.CMD_EDIT_RULES
            })

    def test_param_change_object_with_extra_attribute_in_cmd_raises_exception(
            self):
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'The following extra attributes are present: invalid'):
            parameter_domain.PlatformParameterChange({
                'cmd': self.CMD_EDIT_RULES,
                'new_rules': [],
                'invalid': 'invalid'
            })

    def test_param_change_object_with_valid_data_success(self):
        param_change_object = (
            parameter_domain.PlatformParameterChange({
                'cmd': self.CMD_EDIT_RULES,
                'new_rules': []
            }))

        self.assertEqual(
            param_change_object.cmd, self.CMD_EDIT_RULES)
        self.assertEqual(
            param_change_object.new_rules, [])

    def test_to_dict_returns_correct_dict(self):
        param_change_dict = {
            'cmd': self.CMD_EDIT_RULES,
            'new_rules': []
        }
        param_change_object = parameter_domain.PlatformParameterChange(
            param_change_dict)
        self.assertEqual(
            param_change_object.to_dict(),
            param_change_dict)


class EvaluationContextTests(test_utils.GenericTestBase):
    """Test for the EvaluationContext."""

    def test_create_context_from_dict_returns_correct_instance(self):
        context = parameter_domain.EvaluationContext.from_dict(
            {
                'client_type': 'Android',
                'browser_type': None,
                'app_version': '1.0.0',
                'user_locale': 'en',
            },
            {
                'server_mode': 'dev',
            },
        )
        self.assertEqual(context.client_type, 'Android')
        self.assertEqual(context.browser_type, None)
        self.assertEqual(context.app_version, '1.0.0')
        self.assertEqual(context.user_locale, 'en')
        self.assertEqual(context.server_mode, 'dev')

    def test_validate_with_valid_context_passes_without_exception(self):
        context = parameter_domain.EvaluationContext.from_dict(
            {
                'client_type': 'Android',
                'browser_type': None,
                'app_version': '1.0.0',
                'user_locale': 'en',
            },
            {
                'server_mode': 'dev',
            },
        )
        context.validate()

    def test_validate_with_invalid_client_type_raises_exception(self):
        context = parameter_domain.EvaluationContext.from_dict(
            {
                'client_type': 'invalid',
                'browser_type': None,
                'app_version': '1.0.0',
                'user_locale': 'en',
            },
            {
                'server_mode': 'dev',
            },
        )
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid client type \'invalid\''):
            context.validate()

    def test_validate_with_invalid_browser_type_raises_exception(self):
        context = parameter_domain.EvaluationContext.from_dict(
            {
                'client_type': 'Web',
                'browser_type': 'Invalid',
                'app_version': '1.0.0',
                'user_locale': 'en',
            },
            {
                'server_mode': 'dev',
            },
        )
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid browser type \'Invalid\''):
            context.validate()

    def test_validate_with_invalid_app_version_raises_exception(self):
        context = parameter_domain.EvaluationContext.from_dict(
            {
                'client_type': 'Android',
                'browser_type': None,
                'app_version': 'a.a.a',
                'user_locale': 'en',
            },
            {
                'server_mode': 'dev',
            },
        )
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid version \'a.a.a\''):
            context.validate()

    def test_validate_with_invalid_app_version_flavor_raises_exception(self):
        context = parameter_domain.EvaluationContext.from_dict(
            {
                'client_type': 'Android',
                'browser_type': None,
                'app_version': '1.0.0-abcedef-invalid',
                'user_locale': 'en',
            },
            {
                'server_mode': 'dev',
            },
        )
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid version flavor \'invalid\''):
            context.validate()

    def test_validate_with_invalid_user_locale_raises_exception(self):
        context = parameter_domain.EvaluationContext.from_dict(
            {
                'client_type': 'Android',
                'browser_type': None,
                'app_version': '1.0.0',
                'user_locale': 'invalid',
            },
            {
                'server_mode': 'dev',
            },
        )
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid user locale \'invalid\''):
            context.validate()

    def test_validate_with_invalid_server_mode_raises_exception(self):
        context = parameter_domain.EvaluationContext.from_dict(
            {
                'client_type': 'Android',
                'browser_type': None,
                'app_version': '1.0.0',
                'user_locale': 'en',
            },
            {
                'server_mode': 'invalid',
            },
        )
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid server mode \'invalid\''):
            context.validate()


class PlatformParameterFilterTests(test_utils.GenericTestBase):
    """Test for the PlatformParameterFilter."""

    def _create_example_context(
            self, client_type='Android', browser_type=None, app_version='1.2.3',
            user_locale='en', mode='dev'):
        """Creates and returns an EvaluationContext using the given
        arguments.
        """
        return parameter_domain.EvaluationContext.from_dict(
            {
                'client_type': client_type,
                'browser_type': browser_type,
                'app_version': app_version,
                'user_locale': user_locale,
            },
            {
                'server_mode': mode,
            },
        )

    def _test_flavor_relation_holds(self, version, op, flavor_b):
        """Helper method to test relation 'flavor_a <op> flavor_b' hold,
        where flavor_a is the flavor of the argument 'version'.
        """
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(
                {'type': 'app_version_flavor', 'conditions': [(op, flavor_b)]}
            )
        )
        self.assertTrue(filter_domain.evaluate(
            self._create_example_context(
                app_version=version)))

    def _test_flavor_relation_does_not_hold(self, version, op, flavor_b):
        """Helper method to test relation 'flavor_a <op> flavor_b' doesn't
        holds, where flavor_a is the flavor of the argument 'version'.
        """
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(
                {'type': 'app_version_flavor', 'conditions': [(op, flavor_b)]}
            )
        )
        self.assertFalse(filter_domain.evaluate(
            self._create_example_context(
                app_version=version)))


    def test_create_from_dict_returns_correct_instance(self):
        filter_dict = {'type': 'app_version', 'conditions': [('=', '1.2.3')]}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(filter_dict))

        self.assertEqual(filter_domain.type, 'app_version')
        self.assertEqual(filter_domain.conditions, [('=', '1.2.3')])

    def test_to_dict_returns_correct_dict(self):
        filter_dict = {'type': 'app_version', 'conditions': [('=', '1.2.3')]}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(filter_dict))

        self.assertEqual(filter_domain.to_dict(), filter_dict)

    def test_evaluate_dev_server_mode_filter_with_dev_env_returns_true(self):
        filter_dict = {'type': 'server_mode', 'conditions': [('=', 'dev')]}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(filter_dict))

        dev_context = self._create_example_context(mode='dev')
        self.assertTrue(filter_domain.evaluate(dev_context))

    def test_evaluate_dev_server_mode_filter_with_prod_env_returns_false(self):
        filter_dict = {'type': 'server_mode', 'conditions': [('=', 'dev')]}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(filter_dict))

        prod_context = self._create_example_context(mode='prod')
        self.assertFalse(filter_domain.evaluate(prod_context))

    def test_evaluate_en_user_locale_filter_with_en_locale_returns_true(self):
        filter_dict = {'type': 'user_locale', 'conditions': [('=', 'en')]}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(filter_dict))

        en_context = self._create_example_context(user_locale='en')
        self.assertTrue(filter_domain.evaluate(en_context))

    def test_evaluate_en_user_locale_filter_with_zh_locale_returns_false(self):
        filter_dict = {'type': 'user_locale', 'conditions': [('=', 'en')]}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(filter_dict))

        zh_context = self._create_example_context(user_locale='zh-hans')
        self.assertFalse(filter_domain.evaluate(zh_context))

    def test_evaluate_web_client_filter_with_web_client_returns_true(self):
        filter_dict = {'type': 'client_type', 'conditions': [('=', 'Web')]}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(filter_dict))

        web_context = self._create_example_context(client_type='Web')
        self.assertTrue(filter_domain.evaluate(web_context))

    def test_evaluate_web_client_filter_with_native_client_returns_false(self):
        filter_dict = {'type': 'client_type', 'conditions': [('=', 'Web')]}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(filter_dict))

        native_context = self._create_example_context(client_type='Android')
        self.assertFalse(filter_domain.evaluate(native_context))

    def test_evaluate_chrome_browser_filter_with_chrome_returns_true(self):
        filter_dict = {'type': 'browser_type', 'conditions': [('=', 'Chrome')]}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(filter_dict))

        chrome_context = self._create_example_context(browser_type='Chrome')
        self.assertTrue(filter_domain.evaluate(chrome_context))

    def test_evaluate_chrome_browser_filter_with_firefox_returns_false(self):
        filter_dict = {'type': 'browser_type', 'conditions': [('=', 'Chrome')]}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(filter_dict))

        firefox_context = self._create_example_context(browser_type='Firefox')
        self.assertFalse(filter_domain.evaluate(firefox_context))

    def test_evaluate_eq_version_filter_with_same_version_returns_true(self):
        filter_dict = {'type': 'app_version', 'conditions': [('=', '1.2.3')]}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(filter_dict))
        self.assertTrue(filter_domain.evaluate(
            self._create_example_context(app_version='1.2.3')))

    def test_evaluate_eq_version_filter_with_diff_version_returns_false(self):
        filter_dict = {'type': 'app_version', 'conditions': [('=', '1.2.3')]}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(filter_dict))
        self.assertFalse(filter_domain.evaluate(
            self._create_example_context(app_version='1.2.4')))

    def test_evaluate_gt_version_filter_with_small_version_returns_false(self):
        filter_dict = {'type': 'app_version', 'conditions': [('>', '1.2.3')]}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(filter_dict))
        self.assertFalse(filter_domain.evaluate(
            self._create_example_context(app_version='0.2.3')))
        self.assertFalse(filter_domain.evaluate(
            self._create_example_context(app_version='1.1.2')))

    def test_evaluate_gt_version_filter_with_same_version_returns_false(self):
        filter_dict = {'type': 'app_version', 'conditions': [('>', '1.2.3')]}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(filter_dict))
        self.assertFalse(filter_domain.evaluate(
            self._create_example_context(app_version='1.2.3')))

    def test_evaluate_gt_version_filter_with_large_version_returns_true(self):
        filter_dict = {'type': 'app_version', 'conditions': [('>', '1.2.3')]}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(filter_dict))
        self.assertTrue(filter_domain.evaluate(
            self._create_example_context(app_version='1.2.4')))
        self.assertTrue(filter_domain.evaluate(
            self._create_example_context(app_version='1.3.0')))
        self.assertTrue(filter_domain.evaluate(
            self._create_example_context(app_version='2.0.0')))

    def test_evaluate_gte_version_filter_with_small_version_returns_false(self):
        filter_dict = {'type': 'app_version', 'conditions': [('>=', '1.2.3')]}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(filter_dict))
        self.assertFalse(filter_domain.evaluate(
            self._create_example_context(app_version='0.2.3')))
        self.assertFalse(filter_domain.evaluate(
            self._create_example_context(app_version='1.1.2')))

    def test_evaluate_gte_version_filter_with_same_version_returns_true(self):
        filter_dict = {'type': 'app_version', 'conditions': [('>=', '1.2.3')]}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(filter_dict))
        self.assertTrue(filter_domain.evaluate(
            self._create_example_context(app_version='1.2.3')))

    def test_evaluate_gte_version_filter_with_large_version_returns_true(self):
        filter_dict = {'type': 'app_version', 'conditions': [('>=', '1.2.3')]}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(filter_dict))
        self.assertTrue(filter_domain.evaluate(
            self._create_example_context(app_version='1.2.4')))
        self.assertTrue(filter_domain.evaluate(
            self._create_example_context(app_version='1.3.0')))
        self.assertTrue(filter_domain.evaluate(
            self._create_example_context(app_version='2.0.0')))

    def test_evaluate_lt_version_filter_with_small_version_returns_true(self):
        filter_dict = {'type': 'app_version', 'conditions': [('<', '1.2.3')]}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(filter_dict))
        self.assertTrue(filter_domain.evaluate(
            self._create_example_context(app_version='0.3.4')))
        self.assertTrue(filter_domain.evaluate(
            self._create_example_context(app_version='1.1.0')))
        self.assertTrue(filter_domain.evaluate(
            self._create_example_context(app_version='1.1.2')))
        self.assertTrue(filter_domain.evaluate(
            self._create_example_context(app_version='1.2.2')))

    def test_evaluate_lt_version_filter_with_same_version_returns_false(self):
        filter_dict = {'type': 'app_version', 'conditions': [('<', '1.2.3')]}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(filter_dict))
        self.assertFalse(filter_domain.evaluate(
            self._create_example_context(app_version='1.2.3')))

    def test_evaluate_lt_version_filter_with_large_version_returns_false(self):
        filter_dict = {'type': 'app_version', 'conditions': [('<', '1.2.3')]}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(filter_dict))
        self.assertFalse(filter_domain.evaluate(
            self._create_example_context(app_version='1.2.4')))
        self.assertFalse(filter_domain.evaluate(
            self._create_example_context(app_version='1.3.0')))
        self.assertFalse(filter_domain.evaluate(
            self._create_example_context(app_version='1.10.0')))
        self.assertFalse(filter_domain.evaluate(
            self._create_example_context(app_version='2.0.0')))

    def test_evaluate_lte_version_filter_with_small_version_returns_true(self):
        filter_dict = {'type': 'app_version', 'conditions': [('<=', '1.2.3')]}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(filter_dict))
        self.assertTrue(filter_domain.evaluate(
            self._create_example_context(app_version='0.3.4')))
        self.assertTrue(filter_domain.evaluate(
            self._create_example_context(app_version='1.1.0')))
        self.assertTrue(filter_domain.evaluate(
            self._create_example_context(app_version='1.2.2')))

    def test_evaluate_lte_version_filter_with_same_version_returns_true(self):
        filter_dict = {'type': 'app_version', 'conditions': [('<=', '1.2.3')]}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(filter_dict))
        self.assertTrue(filter_domain.evaluate(
            self._create_example_context(app_version='1.2.3')))

    def test_evaluate_lte_version_filter_with_large_version_returns_false(self):
        filter_dict = {'type': 'app_version', 'conditions': [('<=', '1.2.3')]}
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(filter_dict))
        self.assertFalse(filter_domain.evaluate(
            self._create_example_context(app_version='1.2.4')))
        self.assertFalse(filter_domain.evaluate(
            self._create_example_context(app_version='1.3.0')))
        self.assertFalse(filter_domain.evaluate(
            self._create_example_context(app_version='1.10.0')))
        self.assertFalse(filter_domain.evaluate(
            self._create_example_context(app_version='2.0.0')))

    def test_evaluate_test_version_with_eq_test_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-test', '=', 'test')

    def test_evaluate_test_version_with_eq_alpha_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-test', '=', 'alpha')

    def test_evaluate_test_version_with_eq_beta_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-test', '=', 'beta')

    def test_evaluate_test_version_with_eq_release_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-test', '=', 'release')

    def test_evaluate_test_version_with_lt_test_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-test', '<', 'test')

    def test_evaluate_test_version_with_lt_alpha_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-test', '<', 'alpha')

    def test_evaluate_test_version_with_lt_beta_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-test', '<', 'beta')

    def test_evaluate_test_version_with_lt_release_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-test', '<', 'release')

    def test_evaluate_test_version_with_lte_test_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-test', '<=', 'test')

    def test_evaluate_test_version_with_lte_alpha_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-test', '<=', 'alpha')

    def test_evaluate_test_version_with_lte_beta_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-test', '<=', 'beta')

    def test_evaluate_test_version_with_lte_release_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-test', '<=', 'release')

    def test_evaluate_test_version_with_gt_test_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-test', '>', 'test')

    def test_evaluate_test_version_with_gt_alpha_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-test', '>', 'alpha')

    def test_evaluate_test_version_with_gt_beta_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-test', '>', 'beta')

    def test_evaluate_test_version_with_gt_release_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-test', '>', 'release')

    def test_evaluate_test_version_with_gte_test_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-test', '>=', 'test')

    def test_evaluate_test_version_with_gte_alpha_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-test', '>=', 'alpha')

    def test_evaluate_test_version_with_gte_beta_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-test', '>=', 'beta')

    def test_evaluate_test_version_with_gte_release_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-test', '>=', 'release')

    def test_evaluate_alpha_version_with_eq_test_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-alpha', '=', 'test')

    def test_evaluate_alpha_version_with_eq_alpha_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-alpha', '=', 'alpha')

    def test_evaluate_alpha_version_with_eq_beta_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-alpha', '=', 'beta')

    def test_evaluate_alpha_version_with_eq_release_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-alpha', '=', 'release')

    def test_evaluate_alpha_version_with_lt_test_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-alpha', '<', 'test')

    def test_evaluate_alpha_version_with_lt_alpha_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-alpha', '<', 'alpha')

    def test_evaluate_alpha_version_with_lt_beta_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-alpha', '<', 'beta')

    def test_evaluate_alpha_version_with_lt_release_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-alpha', '<', 'release')

    def test_evaluate_alpha_version_with_lte_test_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-alpha', '<=', 'test')

    def test_evaluate_alpha_version_with_lte_alpha_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-alpha', '<=', 'alpha')

    def test_evaluate_alpha_version_with_lte_beta_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-alpha', '<=', 'beta')

    def test_evaluate_alpha_version_with_lte_release_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-alpha', '<=', 'release')

    def test_evaluate_alpha_version_with_gt_test_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-alpha', '>', 'test')

    def test_evaluate_alpha_version_with_gt_alpha_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-alpha', '>', 'alpha')

    def test_evaluate_alpha_version_with_gt_beta_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-alpha', '>', 'beta')

    def test_evaluate_alpha_version_with_gt_release_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-alpha', '>', 'release')

    def test_evaluate_alpha_version_with_gte_test_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-alpha', '>=', 'test')

    def test_evaluate_alpha_version_with_gte_alpha_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-alpha', '>=', 'alpha')

    def test_evaluate_alpha_version_with_gte_beta_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-alpha', '>=', 'beta')

    def test_evaluate_alpha_version_with_gte_release_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-alpha', '>=', 'release')

    def test_evaluate_beta_version_with_eq_test_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-beta', '=', 'test')

    def test_evaluate_beta_version_with_eq_alpha_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-beta', '=', 'alpha')

    def test_evaluate_beta_version_with_eq_beta_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-beta', '=', 'beta')

    def test_evaluate_beta_version_with_eq_release_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-beta', '=', 'release')

    def test_evaluate_beta_version_with_lt_test_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-beta', '<', 'test')

    def test_evaluate_beta_version_with_lt_alpha_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-beta', '<', 'alpha')

    def test_evaluate_beta_version_with_lt_beta_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-beta', '<', 'beta')

    def test_evaluate_beta_version_with_lt_release_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-beta', '<', 'release')

    def test_evaluate_beta_version_with_lte_test_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-beta', '<=', 'test')

    def test_evaluate_beta_version_with_lte_alpha_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-beta', '<=', 'alpha')

    def test_evaluate_beta_version_with_lte_beta_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-beta', '<=', 'beta')

    def test_evaluate_beta_version_with_lte_release_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-beta', '<=', 'release')

    def test_evaluate_beta_version_with_gt_test_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-beta', '>', 'test')

    def test_evaluate_beta_version_with_gt_alpha_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-beta', '>', 'alpha')

    def test_evaluate_beta_version_with_gt_beta_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-beta', '>', 'beta')

    def test_evaluate_beta_version_with_gt_release_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-beta', '>', 'release')

    def test_evaluate_beta_version_with_gte_test_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-beta', '>=', 'test')

    def test_evaluate_beta_version_with_gte_alpha_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-beta', '>=', 'alpha')

    def test_evaluate_beta_version_with_gte_beta_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-beta', '>=', 'beta')

    def test_evaluate_beta_version_with_gte_release_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-beta', '>=', 'release')

    def test_evaluate_release_version_with_eq_test_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-release', '=', 'test')

    def test_evaluate_release_version_with_eq_alpha_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-release', '=', 'alpha')

    def test_evaluate_release_version_with_eq_beta_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-release', '=', 'beta')

    def test_evaluate_release_version_with_eq_release_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-release', '=', 'release')

    def test_evaluate_release_version_with_lt_test_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-release', '<', 'test')

    def test_evaluate_release_version_with_lt_alpha_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-release', '<', 'alpha')

    def test_evaluate_release_version_with_lt_beta_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-release', '<', 'beta')

    def test_evaluate_release_version_with_lt_release_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-release', '<', 'release')

    def test_evaluate_release_version_with_lte_test_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-release', '<=', 'test')

    def test_evaluate_release_version_with_lte_alpha_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-release', '<=', 'alpha')

    def test_evaluate_release_version_with_lte_beta_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-release', '<=', 'beta')

    def test_evaluate_release_version_with_lte_release_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-release', '<=', 'release')

    def test_evaluate_release_version_with_gt_test_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-release', '>', 'test')

    def test_evaluate_release_version_with_gt_alpha_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-release', '>', 'alpha')

    def test_evaluate_release_version_with_gt_beta_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-release', '>', 'beta')

    def test_evaluate_release_version_with_gt_release_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef-release', '>', 'release')

    def test_evaluate_release_version_with_gte_test_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-release', '>=', 'test')

    def test_evaluate_release_version_with_gte_alpha_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-release', '>=', 'alpha')

    def test_evaluate_release_version_with_gte_beta_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-release', '>=', 'beta')

    def test_evaluate_release_version_with_gte_release_cond_returns_true(
            self):
        self._test_flavor_relation_holds(
            '1.0.0-abcdef-release', '>=', 'release')

    def test_evaluate_unspecified_version_with_eq_test_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef', '=', 'test')

    def test_evaluate_unspecified_version_with_eq_alpha_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef', '=', 'alpha')

    def test_evaluate_unspecified_version_with_eq_beta_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef', '=', 'beta')

    def test_evaluate_unspecified_version_with_eq_release_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef', '=', 'release')

    def test_evaluate_unspecified_version_with_lt_test_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef', '<', 'test')

    def test_evaluate_unspecified_version_with_lt_alpha_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef', '<', 'alpha')

    def test_evaluate_unspecified_version_with_lt_beta_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef', '<', 'beta')

    def test_evaluate_unspecified_version_with_lt_release_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef', '<', 'release')

    def test_evaluate_unspecified_version_with_lte_test_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef', '<=', 'test')

    def test_evaluate_unspecified_version_with_lte_alpha_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef', '<=', 'alpha')

    def test_evaluate_unspecified_version_with_lte_beta_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef', '<=', 'beta')

    def test_evaluate_unspecified_version_with_lte_release_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef', '<=', 'release')

    def test_evaluate_unspecified_version_with_gt_test_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef', '>', 'test')

    def test_evaluate_unspecified_version_with_gt_alpha_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef', '>', 'alpha')

    def test_evaluate_unspecified_version_with_gt_beta_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef', '>', 'beta')

    def test_evaluate_unspecified_version_with_gt_release_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef', '>', 'release')

    def test_evaluate_unspecified_version_with_gte_test_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef', '>=', 'test')

    def test_evaluate_unspecified_version_with_gte_alpha_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef', '>=', 'alpha')

    def test_evaluate_unspecified_version_with_gte_beta_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef', '>=', 'beta')

    def test_evaluate_unspecified_version_with_gte_release_cond_returns_false(
            self):
        self._test_flavor_relation_does_not_hold(
            '1.0.0-abcdef', '>=', 'release')

    def test_evaluate_multi_value_filter_with_one_matched_returns_true(self):
        filter_dict = {
            'type': 'server_mode',
            'conditions': [('=', 'dev'), ('=', 'prod')]
        }
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(filter_dict))

        dev_context = self._create_example_context(mode='dev')
        self.assertTrue(filter_domain.evaluate(dev_context))

    def test_evaluate_multi_value_filter_with_none_matched_returns_true(self):
        filter_dict = {
            'type': 'server_mode',
            'conditions': [('=', 'dev'), ('=', 'prod')]
        }
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(filter_dict))

        test_context = self._create_example_context(mode='test')
        self.assertFalse(filter_domain.evaluate(test_context))

    def test_evaluate_app_version_filter_without_version_returns_false(self):
        filter_dict = {
            'type': 'app_version',
            'conditions': [('=', '1.2.3'), ('=', '1.2.4')]
        }
        filter_domain = parameter_domain.PlatformParameterFilter.from_dict(
            filter_dict)

        self.assertFalse(filter_domain.evaluate(
            self._create_example_context(app_version=None)))

    def test_evaluate_filter_with_unsupported_operation_raises_exception(self):
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(
                {'type': 'server_mode', 'conditions': [('!=', 'dev')]}
            ))
        with self.assertRaisesRegexp(
            Exception, 'Unsupported comparison operator \'!=\''):
            filter_domain.evaluate(self._create_example_context())

    def test_validate_filter_passes_without_exception(self):
        filter_dict = {
            'type': 'server_mode',
            'conditions': [('=', 'dev'), ('=', 'prod')]
        }
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(filter_dict))
        filter_domain.validate()

    def test_validate_filter_with_invalid_type_raises_exception(self):
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(
                {'type': 'invalid', 'conditions': [('=', 'value1')]}
            ))
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Unsupported filter type \'invalid\''):
            filter_domain.validate()

    def test_validate_filter_with_unsupported_operation_raises_exception(self):
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(
                {'type': 'server_mode', 'conditions': [('!=', 'dev')]}
            ))
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Unsupported comparison operator \'!=\''):
            filter_domain.validate()

    def test_validate_filter_with_invalid_server_mode_raises_exception(self):
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(
                {'type': 'server_mode', 'conditions': [('=', 'invalid')]}
            ))
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid server mode \'invalid\''):
            filter_domain.validate()

    def test_validate_filter_with_invalid_user_locale_raises_exception(self):
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(
                {'type': 'user_locale', 'conditions': [('=', 'invalid')]}
            ))
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid user locale \'invalid\''):
            filter_domain.validate()

    def test_validate_filter_with_invalid_client_type_raises_exception(self):
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(
                {'type': 'client_type', 'conditions': [('=', 'invalid')]}
            ))
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid client type \'invalid\''):
            filter_domain.validate()

    def test_validate_filter_with_invalid_version_expr_raises_exception(self):
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(
                {'type': 'app_version', 'conditions': [('=', '1.a.2')]}
            ))

        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid version expression \'1.a.2\''):
            filter_domain.validate()

    def test_validate_filter_with_invalid_version_flavor_raises_exception(self):
        filter_domain = (
            parameter_domain
            .PlatformParameterFilter.from_dict(
                {'type': 'app_version_flavor', 'conditions': [('=', 'invalid')]}
            ))

        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid app version flavor \'invalid\''):
            filter_domain.validate()


class PlatformParameterRuleTests(test_utils.GenericTestBase):
    """Test for the PlatformParameterRule."""

    def test_create_from_dict_returns_correct_instance(self):
        filters = [
            {
                'type': 'app_version',
                'conditions': [('=', '1.2.3')]
            },
            {
                'type': 'server_mode',
                'conditions': [('=', 'dev'), ('=', 'test')]
            }
        ]
        rule = parameter_domain.PlatformParameterRule.from_dict(
            {
                'filters': filters,
                'value_when_matched': False,
            },
        )
        self.assertIsInstance(rule, parameter_domain.PlatformParameterRule)

        filter_domain = rule.filters[0]
        self.assertIsInstance(
            filter_domain, parameter_domain.PlatformParameterFilter)
        self.assertEqual(len(rule.filters), 2)
        self.assertEqual(filter_domain.type, 'app_version')
        self.assertEqual(filter_domain.conditions, [('=', '1.2.3')])
        self.assertEqual(rule.value_when_matched, False)

    def test_to_dict_returns_correct_dict(self):
        rule_dict = {
            'filters': [
                {
                    'type': 'app_version',
                    'conditions': [('=', '1.2.3')]
                }
            ],
            'value_when_matched': False,
        }
        rule = parameter_domain.PlatformParameterRule.from_dict(rule_dict)
        self.assertEqual(rule.to_dict(), rule_dict)

    def test_has_server_mode_filter_with_mode_filter_returns_true(self):
        rule = parameter_domain.PlatformParameterRule.from_dict(
            {
                'filters': [
                    {'type': 'server_mode', 'conditions': [('=', 'dev')]}
                ],
                'value_when_matched': False,
            },
        )
        self.assertTrue(rule.has_server_mode_filter())

    def test_has_server_mode_filter_without_mode_filter_returns_false(self):
        rule = parameter_domain.PlatformParameterRule.from_dict(
            {
                'filters': [
                    {'type': 'app_version', 'conditions': [('=', '1.2.3')]}
                ],
                'value_when_matched': False,
            },
        )
        self.assertFalse(rule.has_server_mode_filter())

    def test_evaluation_with_matching_context_returns_true(self):
        rule = parameter_domain.PlatformParameterRule.from_dict(
            {
                'filters': [
                    {'type': 'app_version', 'conditions': [('=', '1.2.3')]},
                    {'type': 'user_locale', 'conditions': [('=', 'en')]},
                ],
                'value_when_matched': 'matched_val',
            },
        )
        context = parameter_domain.EvaluationContext.from_dict(
            {
                'client_type': 'Android',
                'browser_type': None,
                'app_version': '1.2.3',
                'user_locale': 'en',
            },
            {
                'server_mode': 'dev',
            },
        )
        self.assertTrue(rule.evaluate(context))

    def test_evaluation_with_unmatching_context_returns_false(self):
        rule = parameter_domain.PlatformParameterRule.from_dict(
            {
                'filters': [
                    {'type': 'app_version', 'conditions': [('=', '1.2.3')]},
                    {'type': 'user_locale', 'conditions': [('=', 'en-UK')]},
                ],
                'value_when_matched': 'matched_val',
            },
        )
        context = parameter_domain.EvaluationContext.from_dict(
            {
                'client_type': 'Android',
                'browser_type': None,
                'app_version': '1.2.3',
                'user_locale': 'en',
            },
            {
                'server_mode': 'dev',
            },
        )
        self.assertFalse(rule.evaluate(context))

    def test_validate_with_invalid_filter_raises_exception(self):
        filters = [
            {'type': 'app_version', 'conditions': [('=', '1.2.3')]},
            {'type': 'invalid', 'conditions': [('=', '1.2.3')]},
        ]
        rule = parameter_domain.PlatformParameterRule.from_dict(
            {
                'filters': filters,
                'value_when_matched': False,
            }
        )
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Unsupported filter type \'invalid\''):
            rule.validate()


class PlatformParameterTests(test_utils.GenericTestBase):
    """Test for the PlatformParameter."""

    def test_create_from_dict_returns_correct_instance(self):
        param = parameter_domain.PlatformParameter.from_dict({
            'name': 'parameter_a',
            'description': 'for test',
            'data_type': 'string',
            'rules': [
                {
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [('=', 'dev')]
                        }
                    ],
                    'value_when_matched': '222'
                }
            ],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'default_value': '333',
            'is_feature': False,
            'feature_stage': None,
        })

        self.assertIsInstance(param, parameter_domain.PlatformParameter)
        self.assertEqual(param.name, 'parameter_a')
        self.assertEqual(param.description, 'for test')
        self.assertEqual(param.data_type, 'string')
        self.assertEqual(len(param.rules), 1)
        self.assertEqual(param.is_feature, False)
        self.assertIsNone(param.feature_stage)
        self.assertEqual(param.default_value, '333')
        self.assertEqual(
            param.rule_schema_version,
            feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION)

    def test_validate_with_invalid_name_raises_exception(self):
        param = parameter_domain.PlatformParameter.from_dict({
            'name': 'Invalid~Name',
            'description': 'for test',
            'data_type': 'string',
            'rules': [
                {
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [('=', 'dev')]
                        }
                    ],
                    'value_when_matched': '222'
                }
            ],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'default_value': '333',
            'is_feature': False,
            'feature_stage': None,
        })
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Invalid parameter name \'%s\'' % param.name):
            param.validate()

        param1 = parameter_domain.PlatformParameter.from_dict({
            'name': 'parameter.name',
            'description': 'for test',
            'data_type': 'string',
            'rules': [
                {
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [('=', 'dev')]
                        }
                    ],
                    'value_when_matched': '222'
                }
            ],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'default_value': '333',
            'is_feature': False,
            'feature_stage': None,
        })
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Invalid parameter name \'%s\'' % param1.name):
            param1.validate()

    def test_validate_with_long_name_raises_exception(self):
        long_name = 'Long_' * 50 + 'Name'
        param = parameter_domain.PlatformParameter.from_dict({
            'name': long_name,
            'description': 'for test',
            'data_type': 'string',
            'rules': [
                {
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [('=', 'dev')]
                        }
                    ],
                    'value_when_matched': '222'
                }
            ],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'default_value': '333',
            'is_feature': False,
            'feature_stage': None,
        })
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Invalid parameter name \'%s\'' % long_name):
            param.validate()

    def test_validate_with_unsupported_data_type_raises_exception(self):
        param = parameter_domain.PlatformParameter.from_dict({
            'name': 'parameter_a',
            'description': 'for test',
            'data_type': 'InvalidType',
            'rules': [
                {
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [('=', 'dev')]
                        }
                    ],
                    'value_when_matched': '222'
                }
            ],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'default_value': '333',
            'is_feature': False,
            'feature_stage': None,
        })
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Unsupported data type \'InvalidType\''):
            param.validate()

    def test_validate_with_inconsistent_data_type_in_rules_raises_exception(
            self):
        param = parameter_domain.PlatformParameter.from_dict({
            'name': 'parameter_a',
            'description': 'for test',
            'data_type': 'bool',
            'rules': [
                {
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [('=', 'dev')]
                        }
                    ],
                    'value_when_matched': '222'
                },
            ],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'default_value': False,
            'is_feature': False,
            'feature_stage': None,
        })
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected bool, received \'222\' in value_when_matched'):
            param.validate()

    def test_validate_with_inconsistent_default_value_type_raises_exception(
            self):
        param = parameter_domain.PlatformParameter.from_dict({
            'name': 'parameter_a',
            'description': 'for test',
            'data_type': 'bool',
            'rules': [],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'default_value': '111',
            'is_feature': False,
            'feature_stage': None,
        })
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Expected bool, received \'111\' in default value'):
            param.validate()

    def test_create_with_old_rule_schema_version_failure(self):
        with self.swap(
            feconf, 'CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION', 2):
            with self.assertRaisesRegexp(
                Exception,
                'Current platform parameter rule schema version is v2, '
                'received v1'):
                parameter_domain.PlatformParameter.from_dict({
                    'name': 'parameter_a',
                    'description': 'for test',
                    'data_type': 'string',
                    'rules': [
                        {
                            'filters': [
                                {
                                    'type': 'server_mode',
                                    'conditions': [('=', 'dev')]
                                }
                            ],
                            'value_when_matched': '222'
                        }
                    ],
                    'rule_schema_version': 1,
                    'default_value': '333',
                    'is_feature': False,
                    'feature_stage': None,
                })

    def test_to_dict_returns_correct_dict(self):
        param_dict = {
            'name': 'parameter_a',
            'description': 'for test',
            'data_type': 'string',
            'rules': [
                {
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [('=', 'dev')]
                        }
                    ],
                    'value_when_matched': '222'
                }
            ],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'default_value': '333',
            'is_feature': False,
            'feature_stage': None
        }
        parameter = parameter_domain.PlatformParameter.from_dict(param_dict)
        self.assertDictEqual(parameter.to_dict(), param_dict)

    def test_set_rules_correctly_changes_rules(self):
        param = parameter_domain.PlatformParameter.from_dict({
            'name': 'parameter_a',
            'description': 'for test',
            'data_type': 'string',
            'rules': [
                {
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [('=', 'dev')]
                        }
                    ],
                    'value_when_matched': '222'
                },
                {
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [('=', 'test')]
                        }
                    ],
                    'value_when_matched': '555'
                }
            ],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'default_value': '333',
            'is_feature': False,
            'feature_stage': None
        })
        new_rule_dict = {
            'filters': [
                {'type': 'server_mode', 'conditions': [('=', 'test')]}
            ],
            'value_when_matched': 'new rule value',
        }
        new_rule = parameter_domain.PlatformParameterRule.from_dict(
            new_rule_dict)
        param.set_rules([new_rule])

        self.assertEqual(len(param.rules), 1)
        self.assertEqual(param.rules[0].to_dict(), new_rule_dict)

    def test_evaluate_with_matched_rule_returns_correct_value(self):
        parameter = parameter_domain.PlatformParameter.from_dict({
            'name': 'parameter_a',
            'description': 'for test',
            'data_type': 'string',
            'rules': [
                {
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [('=', 'dev')]
                        }
                    ],
                    'value_when_matched': '222'
                }
            ],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'default_value': '333',
            'is_feature': False,
            'feature_stage': None,
        })

        dev_context = parameter_domain.EvaluationContext.from_dict(
            {
                'client_type': 'Android',
                'browser_type': None,
                'app_version': '1.2.3',
                'user_locale': 'en',
            },
            {
                'server_mode': 'dev',
            },
        )
        self.assertEqual(parameter.evaluate(dev_context), '222')

    def test_evaluate_without_matched_rule_returns_default_value(self):
        parameter = parameter_domain.PlatformParameter.from_dict({
            'name': 'parameter_a',
            'description': 'for test',
            'data_type': 'string',
            'rules': [
                {
                    'filters': [
                        {
                            'type': 'server_mode',
                            'conditions': [('=', 'dev')]
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

        prod_context = parameter_domain.EvaluationContext.from_dict(
            {
                'client_type': 'Android',
                'browser_type': None,
                'app_version': '1.2.3',
                'user_locale': 'en',
            },
            {
                'server_mode': 'prod',
            },
        )
        self.assertEqual(parameter.evaluate(prod_context), '111')

    def test_validate_feature_passes_without_exception(self):
        parameter = parameter_domain.PlatformParameter.from_dict({
            'name': 'parameter_a',
            'description': 'for test',
            'data_type': 'bool',
            'rules': [
                {
                    'filters': [
                        {'type': 'server_mode', 'conditions': [('=', 'dev')]}
                    ],
                    'value_when_matched': False
                }
            ],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'default_value': False,
            'is_feature': True,
            'feature_stage': 'dev',
        })
        parameter.validate()

    def test_validate_feature_with_invalid_type_raises_exception(self):
        parameter = parameter_domain.PlatformParameter.from_dict({
            'name': 'parameter_a',
            'description': 'for test',
            'data_type': 'string',
            'rules': [],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'default_value': '111',
            'is_feature': True,
            'feature_stage': 'dev',
        })
        with self.assertRaisesRegexp(
            utils.ValidationError,
            'Data type of feature flags must be bool, got \'string\' instead'):
            parameter.validate()

    def test_validate_feature_with_invalid_stage_raises_exception(self):
        parameter = parameter_domain.PlatformParameter.from_dict({
            'name': 'parameter_a',
            'description': 'for test',
            'data_type': 'bool',
            'rules': [],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'default_value': False,
            'is_feature': True,
            'feature_stage': 'Invalid',
        })
        with self.assertRaisesRegexp(
            utils.ValidationError, 'Invalid feature stage, got \'Invalid\''):
            parameter.validate()

    def test_validate_feature_with_no_mode_filter_raises_exception(self):
        parameter = parameter_domain.PlatformParameter.from_dict({
            'name': 'parameter_a',
            'description': 'for test',
            'data_type': 'bool',
            'rules': [
                {
                    'filters': [],
                    'value_when_matched': True
                }
            ],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'default_value': False,
            'is_feature': True,
            'feature_stage': 'dev',
        })
        with self.assertRaisesRegexp(
            utils.ValidationError, 'must have a server_mode filter'):
            parameter.validate()

    def test_validate_dev_feature_for_test_env_raises_exception(self):
        parameter = parameter_domain.PlatformParameter.from_dict({
            'name': 'parameter_a',
            'description': '',
            'data_type': 'bool',
            'rules': [
                {
                    'filters': [
                        {'type': 'server_mode', 'conditions': [('=', 'test')]}],
                    'value_when_matched': True
                }
            ],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'default_value': False,
            'is_feature': True,
            'feature_stage': 'dev',
        })
        with self.assertRaisesRegexp(
            utils.ValidationError, 'cannot be enabled in test or production'):
            parameter.validate()

    def test_validate_dev_feature_for_prod_env_raises_exception(self):
        parameter = parameter_domain.PlatformParameter.from_dict({
            'name': 'parameter_a',
            'description': '',
            'data_type': 'bool',
            'rules': [
                {
                    'filters': [
                        {'type': 'server_mode', 'conditions': [('=', 'prod')]}],
                    'value_when_matched': True
                }
            ],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'default_value': False,
            'is_feature': True,
            'feature_stage': 'dev',
        })
        with self.assertRaisesRegexp(
            utils.ValidationError, 'cannot be enabled in test or production'):
            parameter.validate()

    def test_validate_test_feature_for_prod_env_raises_exception(
            self):
        parameter = parameter_domain.PlatformParameter.from_dict({
            'name': 'parameter_a',
            'description': '',
            'data_type': 'bool',
            'rules': [
                {
                    'filters': [
                        {'type': 'server_mode', 'conditions': [('=', 'prod')]}],
                    'value_when_matched': True
                }
            ],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'default_value': False,
            'is_feature': True,
            'feature_stage': 'test',
        })
        with self.assertRaisesRegexp(
            utils.ValidationError, 'cannot be enabled in production'):
            parameter.validate()

    def test_get_memcache_key_returns_correct_key(self):
        self.assertEqual(
            parameter_domain.PlatformParameter.get_memcache_key('param_name'),
            'PLATFORM_PARAMETER:param_name'
        )
