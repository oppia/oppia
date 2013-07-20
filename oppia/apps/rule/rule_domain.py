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
    subject_type = None

    # Description of the rule, e.g. "is equal to {{x|Int}}"
    description = ''

    def __init__(self, *args):
        param_tuples = self._PARAMS
        if len(args) != len(param_tuples):
            raise ValueError(
                'Expected parameters %s, received %s' % (param_tuples, args))

        for ind, param_tuple in enumerate(param_tuples):
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
