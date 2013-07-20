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

"""Classes relating to Oppia rules."""

__author__ = 'Sean Lip'


class Rule(object):
    """Abstract base class for a rule value object."""
    subject_type = ''

    # Name describing the rule, e.g. "is equal to {{x|Int}}"
    name = ''

    def __init__(self, *args):
        param_tuples = self._PARAMS
        for ind, param_tuple in enumerate(param_tuples):
            setattr(self, param_tuple[0], param_tuple[1].normalize(args[ind]))
        # TODO(sll): Check that all params are set.
        # TODO(sll): Check that there are no extra params.

        self._validate_params()

    def _validate_params(self):
        """Validates the object immediately after initialization."""
        pass

    def _evaluate(self, subject):
        """Returns a (truth_value, additional_data) tuple."""
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
        self.name = '%s and %s' % (rule1.name, rule2.name)

    def eval(self, subject):
        result1, data1 = self.rule1.eval(subject)
        result2, data2 = self.rule2.eval(subject)
        data = data1.copy()
        data.update(data2)
        return (result1 and result2), data


class OrRule(Rule):
    rule1 = None
    rule2 = None

    def __init__(self, rule1, rule2):
        self.rule1 = rule1
        self.rule2 = rule2
        self.name = '%s or %s' % (rule1.name, rule2.name)

    def eval(self, subject):
        result1, data1 = self.rule1.eval(subject)
        result2, data2 = self.rule2.eval(subject)
        data = data1.copy()
        data.update(data2)
        return (result1 or result2), data


class NotRule(Rule):
    rule = None

    def __init__(self, rule):
        self.rule = rule

        # Put 'not' after the first word.
        words_in_name = rule.name.split()
        words_in_name.insert('not', 1)
        self.name = ' '.join(words_in_name)

    def eval(self, subject):
        result, data = self.rule.eval(subject)
        return (not result), {}


def make_AndRule(rule1, rule2):
    return AndRule(rule1, rule2)


def make_OrRule(rule1, rule2):
    return OrRule(rule1, rule2)


def make_NotRule(rule1):
    return NotRule(rule1)
