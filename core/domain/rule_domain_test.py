# coding: utf-8
#
# Copyright 2014 The Oppia Authors. All Rights Reserved.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, softwar
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Tests for rule objects."""

__author__ = 'Sean Lip'

import inspect
import os
import pkgutil

from core.domain import rule_domain
from core.tests import test_utils
from extensions.objects.models import objects
import feconf


class FakeRule(rule_domain.Rule):
    subject_type = objects.Real
    description = 'is between {{x|Real}} and {{y|UnicodeString}}'

    def _evaluate(self, subject):
        return subject == self.x


class RuleServicesUnitTests(test_utils.GenericTestBase):
    """Tests for rule services."""

    def test_get_rules_for_obj_type(self):
        self.assertEqual(
            len(rule_domain.get_rules_for_obj_type('NonnegativeInt')), 1)
        self.assertEqual(
            len(rule_domain.get_rules_for_obj_type('Real')), 7)
        self.assertEqual(
            len(rule_domain.get_rules_for_obj_type('Null')), 0)
        self.assertEqual(
            len(rule_domain.get_rules_for_obj_type('FakeObjType')), 0)


class RuleDomainUnitTests(test_utils.GenericTestBase):
    """Tests for rules."""

    def test_rule_initialization(self):
        with self.assertRaises(ValueError):
            FakeRule()
        with self.assertRaises(ValueError):
            FakeRule(1, 'too_many_args', 3)
        with self.assertRaises(ValueError):
            FakeRule('not_a_number', 'a')
        with self.assertRaises(ValueError):
            FakeRule('wrong_order', 1)

        fake_rule = FakeRule(2, 'a')
        self.assertTrue(fake_rule.x, 2)
        self.assertTrue(fake_rule.y, 'a')
        self.assertEqual(
            fake_rule._PARAMS,
            [('x', objects.Real), ('y', objects.UnicodeString)]
        )


class RuleDataUnitTests(test_utils.GenericTestBase):
    """Tests for the actual rules in extensions/."""

    def test_that_all_rules_have_object_editor_templates(self):
        rule_dir = os.path.join(os.getcwd(), feconf.RULES_DIR)

        at_least_one_rule_found = False

        clses = []

        for loader, name, _ in pkgutil.iter_modules(path=[rule_dir]):
            if name.endswith('_test') or name == 'base':
                continue
            module = loader.find_module(name).load_module(name)
            for name, clazz in inspect.getmembers(module, inspect.isclass):
                param_list = rule_domain.get_param_list(clazz.description)

                for (param_name, param_obj_type) in param_list:
                    # TODO(sll): Get rid of these special cases.
                    if param_obj_type.__name__ in [
                            'NonnegativeInt', 'ListOfGraph',
                            'ListOfCodeEvaluation', 'ListOfCoordTwoDim',
                            'SetOfNormalizedString']:
                        continue

                    self.assertTrue(
                        param_obj_type.has_editor_js_template(),
                        msg='(%s)' % clazz.description)
                    at_least_one_rule_found = True
                clses.append(clazz)

        self.assertTrue(at_least_one_rule_found)


class RuleFunctionUnitTests(test_utils.GenericTestBase):
    """Test for functions involving rules."""

    def test_get_description_strings_for_obj_type(self):
        rule_descriptions = rule_domain.get_description_strings_for_obj_type(
            'UnicodeString')
        self.assertEqual(rule_descriptions, {
            'CaseSensitiveEquals': (
                'is equal to {{x|UnicodeString}}, taking case into account'),
            'Contains': 'contains {{x|UnicodeString}}',
            'Equals': 'is equal to {{x|UnicodeString}}',
            'MatchesBase64EncodedFile': (
                'has same content as the file located at '
                '{{filepath|UnicodeString}}'),
            'StartsWith': 'starts with {{x|UnicodeString}}',
        })
