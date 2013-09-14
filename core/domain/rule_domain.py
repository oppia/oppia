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

from extensions.objects.models import objects
import feconf
import jinja_utils


AND_RULE_TYPE = 'and_rule'
OR_RULE_TYPE = 'or_rule'
NOT_RULE_TYPE = 'not_rule'
DEFAULT_RULE_TYPE = 'default'
ATOMIC_RULE_TYPE = 'atomic'

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
        if name.endswith('_test'):
            continue
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

    # Description of the rule, e.g. "is equal to {{x|Int}}". Should be
    # overridden by subclasses.
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
        """Validates the rule object immediately after initialization."""
        pass

    def _evaluate(self, subject):
        """Returns a boolean indicating the truth value of the evaluation."""
        raise NotImplementedError

    def eval(self, subject):
        """Public evaluation method."""
        return self._evaluate(self.subject_type.normalize(subject))


def get_rule_description(definition, param_specs, answer_type):
    """Gets the description of a rule based on a rule-spec definition dict.

    param_specs is the param specifications list for the exploration.

    answer_type is the type of the reader's answer.

    Here is a sample definition in YAML form which represents the rule
    'if answer < 5 and (has_seen_before == True or answer > 2) and (
        not answer == 3)'.

    rule_type: and_rule
    children:
    - rule_type: atomic
      name: LessThan
      subject: answer
      inputs:
        x: 5
    - rule_type: or_rule
      children:
      - rule_type: atomic
        name: Equals
        subject: has_seen_before
        inputs:
          x: True
      - rule_type: atomic
        name: GreaterThan
        subject: answer
        inputs:
          x: 2
    - rule_type: not_rule
      child:
      - rule_type: atomic
        name: Equals
        subject: answer
        inputs:
          x: 3
    """
    if 'rule_type' not in definition:
        raise Exception('No rule type specified when constructing rule.')

    elif definition['rule_type'] == DEFAULT_RULE_TYPE:
        return 'Default'

    elif definition['rule_type'] == ATOMIC_RULE_TYPE:
        if definition['subject'] == 'answer':
            subject_type = answer_type
        else:
            subject_type = param_specs[definition['subject']].obj_type

        all_rule_classes = get_rules_for_input_type(subject_type)

        rule = next(r for r in all_rule_classes
                    if r.__name__ == definition['name'])
        return rule.description

    elif definition['rule_type'] == AND_RULE_TYPE:
        return ' and '.join([
            get_rule_description(child_dict, param_specs, answer_type)
            for child_dict in definition['children']
        ])

    elif definition['rule_type'] == OR_RULE_TYPE:
        return ' or '.join([
            get_rule_description(child_dict, param_specs, answer_type)
            for child_dict in definition['children']
        ])

    elif definition['rule_type'] == NOT_RULE_TYPE:
        # Put 'not' after the first word.
        description = get_rule_description(
            definition['child'], param_specs, answer_type)
        words = description.split()
        words.insert(1, 'not')
        return ' '.join(words)

    else:
        raise Exception('Unrecognized rule type %s' % definition['rule_type'])


def evaluate_rule(definition, param_specs, answer_type, context_params, answer):
    """Evaluates a rule definition using context_params. Returns a boolean."""

    if 'rule_type' not in definition:
        raise Exception('No rule type specified when constructing rule.')

    elif definition['rule_type'] == DEFAULT_RULE_TYPE:
        return True

    elif definition['rule_type'] == ATOMIC_RULE_TYPE:
        subject_name = definition['subject']

        if subject_name == 'answer':
            subject_type = answer_type
        else:
            subject_type = param_specs[subject_name].obj_type

        all_rule_classes = get_rules_for_input_type(subject_type)
        rule = next(r for r in all_rule_classes
                    if r.__name__ == definition['name'])

        param_list = []
        param_defns = get_param_list(rule.description)
        for (param_name, obj_cls) in param_defns:
            parsed_param = definition['inputs'][param_name]
            if (isinstance(parsed_param, basestring) and '{{' in parsed_param):
                parsed_param = jinja_utils.parse_string(
                    parsed_param, context_params)
            normalized_param = obj_cls.normalize(parsed_param)
            param_list.append(normalized_param)

        if subject_name == 'answer':
            subject = answer
        else:
            subject = context_params[subject_name]

        return rule(*param_list).eval(subject)

    elif definition['rule_type'] == AND_RULE_TYPE:
        for child_dict in definition['children']:
            if not evaluate_rule(
                    child_dict, param_specs, answer_type, context_params, answer):
                return False
        return True

    elif definition['rule_type'] == OR_RULE_TYPE:
        for child_dict in definition['children']:
            if evaluate_rule(
                    child_dict, param_specs, answer_type, context_params, answer):
                return True
        return False

    elif definition['rule_type'] == NOT_RULE_TYPE:
        return (not evaluate_rule(
            definition['child'], param_specs, answer_type, context_params, answer))

    else:
        raise Exception('Unrecognized rule type %s' % definition['rule_type'])
