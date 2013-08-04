# coding: utf-8
#
# Copyright 2013 Google Inc. All Rights Reserved.
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

"""Classes relating to rules."""

__author__ = 'Sean Lip'

import inspect
import os
import pkgutil

from data.objects.models import objects
import feconf


# TODO(sll): In the frontend, use the rule descriptions as the single source
# of truth for the params.


def get_obj_type_for_param_name(rule_class, param_name):
    """Gets the obj type for a given param name."""
    param_list = get_param_list(rule_class.description)
    for item in param_list:
        if item[0] == param_name:
            return item[1]
    raise Exception(
        'Rule %s has no param called %s' % (rule_class.__name__, param_name))


def get_rules_for_input_type(input_type):
    """Gets all rules for a given input type (of type objects.[...])."""
    if input_type is None:
        return []

    rule_dir = os.path.join(os.getcwd(), feconf.RULES_DIR)
    rule_class_name = '%sRule' % input_type.__name__
    results = []

    for loader, name, _ in pkgutil.iter_modules(path=[rule_dir]):
        module = loader.find_module(name).load_module(name)
        for name, clazz in inspect.getmembers(module, inspect.isclass):
            ancestors = clazz.__bases__
            ancestor_class_names = [c.__name__ for c in ancestors]
            if rule_class_name in ancestor_class_names:
                results.append(clazz)

    return results


def get_param_list(description):
    """Get a parameter list from the rule description."""
    param_list = []
    while description.find('{{') != -1:
        opening_index = description.find('{{')
        description = description[opening_index + 2:]

        bar_index = description.find('|')
        param_name = description[: bar_index]
        description = description[bar_index + 1:]

        closing_index = description.find('}}')
        normalizer_string = description[: closing_index]
        description = description[closing_index + 2:]

        param_list.append(
            (param_name, getattr(objects, normalizer_string))
        )

    return param_list


class Rule(object):
    """Abstract base class for a value object that represents a rule.

    All rules assume that the subject and rule initialization parameters
    are JSONifiable objects (such as primitives, lists, dicts, and
    compositions of these, but NOT sets, tuples, etc.). This is enforced
    by normalizing the subject and rule initialization parameters to
    JSONifiable objects before any evaluations are performed.
    """
    subject_type = None

    # Description of the rule, e.g. "is equal to {{x|Int}}"
    description = ''

    _PARAMS = None

    @property
    def params(self):
        if self._PARAMS is None:
            # Derive the rule params from its description.
            self._PARAMS = get_param_list(self.description)

        return self._PARAMS

    def __init__(self, *args):
        if len(args) != len(self.params):
            raise ValueError(
                'Expected parameters %s, received %s' % (self.params, args))

        for ind, param_tuple in enumerate(self.params):
            setattr(self, param_tuple[0], param_tuple[1].normalize(args[ind]))

        self._validate_params()

    def _validate_params(self):
        """Validates the object immediately after initialization."""
        pass

    def _evaluate(self, subject):
        """Returns a boolean indicating the truth value of the evaluation."""
        raise NotImplementedError

    def eval(self, subject):
        """Public evaluation method."""
        return self._evaluate(
            self.subject_type.normalize(subject))


class AndRule(Rule):
    rule1 = None
    rule2 = None

    def __init__(self, rule1, rule2):
        self.rule1 = rule1
        self.rule2 = rule2
        self.description = '%s and %s' % (rule1.description, rule2.description)

    def eval(self, subject):
        result1 = self.rule1.eval(subject)
        result2 = self.rule2.eval(subject)
        return (result1 and result2)


class OrRule(Rule):
    rule1 = None
    rule2 = None

    def __init__(self, rule1, rule2):
        self.rule1 = rule1
        self.rule2 = rule2
        self.description = '%s or %s' % (rule1.description, rule2.description)

    def eval(self, subject):
        result1 = self.rule1.eval(subject)
        result2 = self.rule2.eval(subject)
        return (result1 or result2)


class NotRule(Rule):
    rule = None

    def __init__(self, rule):
        self.rule = rule

        # Put 'not' after the first word.
        words = rule.description.split()
        words.insert(1, 'not')
        self.description = ' '.join(words)

    def eval(self, subject):
        return (not self.rule.eval(subject))
