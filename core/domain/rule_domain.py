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
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS-IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Classes relating to rules."""

import inspect
import os
import pkgutil

from extensions.objects.models import objects
import feconf
import jinja_utils


# TODO(sll): In the frontend, use the rule descriptions as the single source
# of truth for the params.

FUZZY_RULE_TYPE = 'FuzzyMatches'


def get_obj_type_for_param_name(rule_class, param_name):
    """Gets the obj type for a given param name."""
    param_list = get_param_list(rule_class.description)
    for item in param_list:
        if item[0] == param_name:
            return item[1]
    raise Exception(
        'Rule %s has no param called %s' % (rule_class.__name__, param_name))


def get_default_object_values():
    """Returns a dict mapping object types to their default values, taking into
    account only object types which represent rule input parameters.

    Note: we return an explicit dict here in order to avoid unnecessary
    computation, since this dict never changes between a release and is served
    each time the editor page loads. We have backend tests that compare the
    value returned here to an explicitly-computed value -- see

          rule_domain_test.test_get_default_object_values().
    """
    return {
        'CodeString': '',
        'CoordTwoDim': [0.0, 0.0],
        'Graph': {
            'edges': [],
            'isDirected': False,
            'isLabeled': False,
            'isWeighted': False,
            'vertices': []
        },
        'GraphProperty': 'strongly_connected',
        'Int': 0,
        'ListOfCoordTwoDim': [],
        'ListOfGraph': [],
        'LogicErrorCategory': 'mistake',
        'MusicPhrase': [],
        'NonnegativeInt': 0,
        'NormalizedString': u'',
        'Real': 0.0,
        'SetOfHtmlString': [],
        'SetOfNormalizedString': [],
        'SetOfUnicodeString': [],
        'UnicodeString': u''
    }


def get_rules_for_obj_type(obj_type):
    """Gets all rules for a given object type.

    Args:
        obj_type: str. The name of the object type.
    """
    rule_dir = os.path.join(os.getcwd(), feconf.RULES_DIR)
    rule_class_name = '%sRule' % obj_type
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


def get_description_strings_for_obj_type(obj_type):
    """Returns a dict whose keys are rule names and whose values are the
    corresponding description strings.
    """
    rules = get_rules_for_obj_type(obj_type)
    return {
        rule.__name__: rule.description
        for rule in rules
    }


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


CERTAIN_TRUE_VALUE = 1.0
CERTAIN_FALSE_VALUE = 0.0


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

    _params = None
    _fs = None

    @property
    def params(self):
        if self._params is None:
            # Derive the rule params from its description.
            self._params = get_param_list(self.description)

        return self._params

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
        """Returns a normalized value between 0 and 1 indicating the truth value
        of the evaluation, where 1.0 is certainly true and 0.0 is certainly
        false. This is to be implemented in overridden classes, or implemented
        in the frontend.
        """
        raise NotImplementedError

    def _fuzzify_truth_value(self, bool_value):
        """Returns a fuzzy truth value for a crisp true or false value. A crisp
        value of true is represented by the fuzzy value of 1.0 and a crisp
        value of false is represented by 0.0.
        """
        return CERTAIN_TRUE_VALUE if bool(bool_value) else CERTAIN_FALSE_VALUE

    def _invert_fuzzy_truth_value(self, fuzzy_value):
        """Performs a NOT operation on a fuzzy value."""
        return CERTAIN_TRUE_VALUE - fuzzy_value

    def set_fs(self, fs):
        """Set an abstract file system to use with this rule."""
        self._fs = fs
        return self

    @property
    def fs(self):
        return self._fs

    def eval(self, subject):
        """Public evaluation method.

        Args:
            subject: the thing to be evaluated.

        Returns:
            float: the result of the evaluation (between 0.0 and 1.0).
        """
        return self._evaluate(self.subject_type.normalize(subject))


def evaluate_rule(rule_spec, answer_type, context_params, answer, fs):
    """Evaluates a rule spec. Returns a float between 0.0 and 1.0."""
    all_rule_classes = get_rules_for_obj_type(answer_type)
    rule = next(r for r in all_rule_classes
                if r.__name__ == rule_spec.rule_type)

    param_list = []
    param_defns = get_param_list(rule.description)
    for (param_name, obj_cls) in param_defns:
        parsed_param = rule_spec.inputs[param_name]
        if isinstance(parsed_param, basestring) and '{{' in parsed_param:
            parsed_param = jinja_utils.parse_string(
                parsed_param, context_params, autoescape=False)
        normalized_param = obj_cls.normalize(parsed_param)
        param_list.append(normalized_param)

    constructed_rule = rule(*param_list)
    constructed_rule.set_fs(fs)
    return constructed_rule.eval(answer)
