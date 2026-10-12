# coding: utf-8
#
# Copyright 2026 The Oppia Authors. All Rights Reserved.
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

"""Domain objects for Android-only platform parameter configuration."""

from __future__ import annotations

import json
import re

from core import feconf, utils
from core.constants import constants
from core.domain import change_domain

from typing import Dict, Final, List, Optional, Pattern, TypedDict, Union

# Union type defined from allowed types that a platform parameter can contain
# for its data types.
AndroidPlatformDataTypes = Union[str, int, bool, float]

ALLOWED_APP_VERSION_FLAVORS: List[str] = (
    constants.PLATFORM_PARAMETER_ALLOWED_APP_VERSION_FLAVORS
)
APP_VERSION_WITH_HASH_REGEXP: Pattern[str] = re.compile(
    constants.PLATFORM_PARAMETER_APP_VERSION_WITH_HASH_REGEXP
)
APP_VERSION_WITHOUT_HASH_REGEXP: Pattern[str] = re.compile(
    constants.PLATFORM_PARAMETER_APP_VERSION_WITHOUT_HASH_REGEXP
)


class AndroidPlatformParameterChange(change_domain.BaseChange):
    """Domain object for changes made to a android platform parameter object.

    The allowed commands, together with the attributes:
        - 'edit_rules' (with new_rules)
    """

    CMD_EDIT_RULES: Final = 'edit_rules'
    ALLOWED_COMMANDS: List[feconf.ValidCmdDict] = [
        {
            'name': CMD_EDIT_RULES,
            'required_attribute_names': ['new_rules'],
            'optional_attribute_names': [],
            'user_id_attribute_names': [],
            'allowed_values': {},
            'deprecated_values': {},
        }
    ]


class EditRulesAndroidPlatformParameterCmd(AndroidPlatformParameterChange):
    """Class representing the AndroidPlatformParameterChange's
    CMD_EDIT_RULES command.
    """

    new_rules: List[str]


class AndroidEvaluationContextDict(TypedDict):
    """Dictionary representation of an Android evaluation context."""

    app_version: str
    app_version_flavour: str


class AndroidEvaluationContext:
    """Domain object representing the context for Android platform parameter evaluation."""

    def __init__(self, app_version: str, app_version_flavour: str) -> None:
        self._app_version = app_version
        self._app_version_flavour = app_version_flavour

    @property
    def app_version(self) -> str:
        """Returns the numeric Android app version.

        Returns:
            str. The numeric Android app version.
        """
        return self._app_version

    @property
    def app_version_flavour(self) -> str:
        """Returns the Android app version flavour.

        Returns:
            str. The Android app version flavour.
        """
        return self._app_version_flavour

    def validate(self) -> None:
        """Validates the Android app version and its flavour."""
        if not isinstance(self._app_version, str):
            raise utils.ValidationError(
                'Invalid Android app version \'%s\', expected to be a '
                'string.' % self._app_version
            )
        if not (APP_VERSION_WITHOUT_HASH_REGEXP.fullmatch(self._app_version)):
            raise utils.ValidationError(
                'Invalid Android app version \'%s\', expected to match regexp '
                '%s.' % (self._app_version, APP_VERSION_WITH_HASH_REGEXP)
            )

        if self._app_version_flavour not in ALLOWED_APP_VERSION_FLAVORS:
            raise utils.ValidationError(
                'Invalid Android app version flavour \'%s\', must be one of '
                '%s.'
                % (
                    self._app_version_flavour,
                    ALLOWED_APP_VERSION_FLAVORS,
                )
            )

    def to_dict(self) -> AndroidEvaluationContextDict:
        """Returns a dict representation of this context.

        Returns:
            dict. A dictionary mapping the Android app version and flavour.
        """
        return {
            'app_version': self._app_version,
            'app_version_flavour': self._app_version_flavour,
        }

    @classmethod
    def from_dict(
        cls, context_dict: AndroidEvaluationContextDict
    ) -> AndroidEvaluationContext:
        """Returns an Android evaluation context from a dict.

        Args:
            context_dict: dict. A dict mapping the Android app version and
                flavour.

        Returns:
            AndroidEvaluationContext. The corresponding Android evaluation
            context object.
        """
        return cls(
            context_dict['app_version'],
            context_dict['app_version_flavour'],
        )


class AndroidPlatformParameterFilterDict(TypedDict):
    """Dictionary representation of an Android platform parameter filter."""

    type: str
    conditions: List[List[str]]


class AndroidPlatformParameterFilter:
    """Domain object for filters in android platform parameters."""

    SUPPORTED_FILTER_TYPES: Final = [
        'app_min_version',
        'app_max_version',
        'app_version_flavour',
    ]
    SUPPORTED_OP_FOR_FILTERS: Final[Dict[str, List[str]]] = {
        'app_min_version': ['='],
        'app_max_version': ['='],
        'app_version_flavour': ['=', '<', '<=', '>', '>='],
    }

    def __init__(self, filter_type: str, conditions: List[List[str]]) -> None:
        self._type = filter_type
        self._conditions = conditions

    @property
    def type(self) -> str:
        """Returns filter type.

        Returns:
            str. The filter type.
        """
        return self._type

    @property
    def conditions(self) -> List[List[str]]:
        """Returns filter conditions.

        Returns:
            list(list(str)). The filter conditions. Each element of the list
            contain a list with 2-elements [op, value], where op is the operator
            for comparison, value is the value used for comparison..
        """
        return self._conditions

    def evaluate(self, context: AndroidEvaluationContext) -> bool:
        """Tries to match the given context with the filter against its
        value(s).

        Args:
            context: AndroidEvaluationContext. The context for evaluation.

        Returns:
            bool. True if the filter is matched.
        """
        return any(
            self._evaluate_single_value(context, op, value)
            for op, value in self._conditions
        )

    def _evaluate_single_value(
        self, context: AndroidEvaluationContext, op: str, value: str
    ) -> bool:
        """Evaluates a single value against the given context.

        Args:
            context: AndroidEvaluationContext. The context for evaluation.
            op: str. The operator for comparison.
            value: str. The value used for comparison.

        Returns:
            bool. True if the filter is matched.

            Raises:
                Exception. Given operator is not supported for the filter type.
        """
        if self._type == 'app_version_flavour':
            # Ruling out the possibility of None for mypy type checking.
            assert context.app_version_flavour is not None
            return self._match_app_version_flavour(context, op, value)

        comparison_result = self._compare_versions(context.app_version, value)
        if self._type == 'app_min_version' and op == '=':
            return comparison_result >= 0
        if self._type == 'app_max_version' and op == '=':
            return comparison_result <= 0
        return False

    def _match_app_version_flavour(
        self, context: AndroidEvaluationContext, op: str, value: str
    ) -> bool:
        """Matches the app version flavour against the given context.

        Args:
            context: AndroidEvaluationContext. The context for evaluation.
            op: str. The operator for comparison.
            value: str. The value used for comparison.

        Returns:
            bool. True if the filter is matched.
        """

        is_equal = context._app_version_flavour == value
        is_client_flavor_smaller = self._is_first_flavor_smaller(
            context._app_version_flavour, value
        )
        is_client_flavor_larger = self._is_first_flavor_smaller(
            value, context._app_version_flavour
        )
        if op == '=':
            return is_equal
        elif op == '<':
            return is_client_flavor_smaller
        elif op == '<=':
            return is_equal or is_client_flavor_smaller
        elif op == '>':
            return is_client_flavor_larger
        elif op == '>=':
            return is_equal or is_client_flavor_larger
        else:
            raise Exception(
                'Unsupported comparison operator \'%s\' for %s filter, '
                'expected one of %s.'
                % (op, self._type, self.SUPPORTED_OP_FOR_FILTERS[self._type])
            )

    def _is_first_flavor_smaller(self, flavor_a: str, flavor_b: str) -> bool:
        """Compares two version flavors, return True if the first version is
        smaller in the following ordering:
        'test' < 'alpha' < 'beta' < 'release'.

        Args:
            flavor_a: str. The version flavor.
            flavor_b: str. The version flavor.

        Returns:
            bool. True if the first flavor is smaller.
        """
        return ALLOWED_APP_VERSION_FLAVORS.index(
            flavor_a
        ) < ALLOWED_APP_VERSION_FLAVORS.index(flavor_b)

    def _compare_versions(self, version_a: str, version_b: str) -> int:
        """Compares dotted numeric versions, padding missing components with 0.

        Args:
            version_a: str. The first version string for comparison.
            version_b: str. The second version string for comparison.

        Returns:
            int. -1 if the first version is smaller, 0 if equal, and 1 if the
            first version is larger.
        """
        if self._is_first_version_smaller(version_a, version_b):
            return -1
        if self._is_first_version_smaller(version_b, version_a):
            return 1
        return 0

    def _is_first_version_smaller(self, version_a: str, version_b: str) -> bool:
        """Compares two version strings, return True if the first version is
        smaller.

        Args:
            version_a: str. The version string (e.g. '12.5').
            version_b: str. The version string (e.g. '12.5').

        Returns:
            bool. True if the first version is smaller.
        """
        splitted_version_a = [int(part) for part in version_a.split('.')]
        splitted_version_b = [int(part) for part in version_b.split('.')]
        max_len = max(len(splitted_version_a), len(splitted_version_b))
        splitted_version_a.extend([0] * (max_len - len(splitted_version_a)))
        splitted_version_b.extend([0] * (max_len - len(splitted_version_b)))

        for sub_version_a, sub_version_b in zip(
            splitted_version_a, splitted_version_b
        ):
            if sub_version_a < sub_version_b:
                return True
            elif sub_version_a > sub_version_b:
                return False
        return False

    def validate(self) -> None:
        """Validates the AndroidPlatformParameterFilter domain object.

        Raises:
            ValidationError. The filter type, operator, or condition values are
            invalid.
        """
        if self._type not in self.SUPPORTED_FILTER_TYPES:
            raise utils.ValidationError(
                'Unsupported Android platform parameter filter type \'%s\'.'
                % self._type
            )

        if not isinstance(self._conditions, list):
            raise utils.ValidationError(
                'Android platform parameter filter conditions must be a list.'
            )

        for condition in self._conditions:
            if (
                not isinstance(condition, (list, tuple))
                or len(condition) != 2
                or not all(isinstance(value, str) for value in condition)
            ):
                raise utils.ValidationError(
                    'Each Android platform parameter filter condition must '
                    'contain a string operator and string value.'
                )

            op, value = condition
            if op not in self.SUPPORTED_OP_FOR_FILTERS[self._type]:
                raise utils.ValidationError(
                    'Unsupported comparison operator \'%s\' for %s filter, '
                    'expected one of %s.'
                    % (
                        op,
                        self._type,
                        self.SUPPORTED_OP_FOR_FILTERS[self._type],
                    )
                )
            if self._type == 'app_version_flavour':
                if value not in ALLOWED_APP_VERSION_FLAVORS:
                    raise utils.ValidationError(
                        'Invalid Android app version flavour \'%s\', must be '
                        'one of %s.'
                        % (
                            value,
                            ALLOWED_APP_VERSION_FLAVORS,
                        )
                    )
            elif not APP_VERSION_WITHOUT_HASH_REGEXP.fullmatch(value):
                raise utils.ValidationError(
                    'Invalid Android app version expression \'%s\'.' % value
                )

    def to_dict(self) -> AndroidPlatformParameterFilterDict:
        """Returns a dict representation of the AndroidPlatformParameterFilter domain
        object.

        Returns:
            dict. A dict mapping of all fields of the filter object.
        """
        return {
            'type': self._type,
            'conditions': self._conditions,
        }

    @classmethod
    def from_dict(
        cls, filter_dict: AndroidPlatformParameterFilterDict
    ) -> AndroidPlatformParameterFilter:
        """Returns an AndroidPlatformParameterFilter object from a dict.

        Args:
            filter_dict: dict. A dict mapping of all fields of AndroidPlatformParameterFilter
                object.

        Returns:
            AndroidPlatformParameterFilter. The corresponding AndroidPlatformParameterFilter domain
            object.
        """
        return cls(filter_dict['type'], filter_dict['conditions'])


class AndroidPlatformParameterRuleDict(TypedDict):
    """Dictionary representation of an Android platform parameter rule."""

    filters: List[AndroidPlatformParameterFilterDict]
    value_when_matched: AndroidPlatformDataTypes


class AndroidPlatformParameterRule:
    """Domain object for an ordered Android parameter rule."""

    def __init__(
        self,
        filters: List[AndroidPlatformParameterFilter],
        value_when_matched: AndroidPlatformDataTypes,
    ) -> None:
        self._filters = filters
        self._value_when_matched = value_when_matched

    @property
    def filters(self) -> List[AndroidPlatformParameterFilter]:
        """Returns the filters of this rule.

        Returns:
            list(AndroidPlatformParameterFilter). The ordered filters for this
            rule.
        """
        return self._filters

    @property
    def value_when_matched(self) -> AndroidPlatformDataTypes:
        """Returns the value produced when this rule matches.

        Returns:
            AndroidPlatformDataTypes. The value produced when this rule matches.
        """
        return self._value_when_matched

    def evaluate(self, context: AndroidEvaluationContext) -> bool:
        """Returns whether every filter in this rule matches.

        Args:
            context: AndroidEvaluationContext. The context for evaluation.

        Returns:
            bool. True if every filter in this rule matches.
        """
        return all(
            filter_domain.evaluate(context) for filter_domain in self._filters
        )

    def validate(self) -> None:
        """Validates all filters in this rule.

        Raises:
            ValidationError. One or more filters in this rule are invalid.
        """
        for filter_domain in self._filters:
            filter_domain.validate()

    def to_dict(self) -> AndroidPlatformParameterRuleDict:
        """Returns a dict representation of the AndroidPlatformParameterRule
        domain object.

        Returns:
            dict. A dict mapping of all fields of the AndroidPlatformParameterRule
            domain object.
        """
        return {
            'filters': [
                filter_domain.to_dict() for filter_domain in self._filters
            ],
            'value_when_matched': self._value_when_matched,
        }

    @classmethod
    def from_dict(
        cls, rule_dict: AndroidPlatformParameterRuleDict
    ) -> AndroidPlatformParameterRule:
        """Returns an AndroidPlatformParameterRule object from a dict.

        Args:
            rule_dict: dict. A dict mapping of all fields of the AndroidPlatformParameterRule
            domain object.

        Returns:
            AndroidPlatformParameterRule. The corresponding AndroidPlatformParameterRule
            domain object.
        """
        return cls(
            [
                AndroidPlatformParameterFilter.from_dict(filter_dict)
                for filter_dict in rule_dict['filters']
            ],
            rule_dict['value_when_matched'],
        )


class AndroidPlatformParameterDict(TypedDict):
    """Dictionary representation of an Android platform parameter."""

    name: str
    description: str
    data_type: str
    rules: List[AndroidPlatformParameterRuleDict]
    rule_schema_version: int
    default_value: AndroidPlatformDataTypes


class AndroidPlatformParameter:
    """Domain object for Android platform parameter."""

    PARAMETER_NAME_REGEXP: Final = r'^[A-Za-z0-9_]{1,100}$'
    DATA_TYPE_PREDICATES_DICT = {
        'bool': lambda value: isinstance(value, bool),
        'number': lambda value: isinstance(value, (int, float))
        and not isinstance(value, bool),
        'string': lambda value: isinstance(value, str),
    }
    DATA_TYPE_BY_DEFAULT_TYPE: Final[Dict[type, str]] = {
        bool: 'bool',
        int: 'number',
        float: 'number',
        str: 'string',
    }

    def __init__(
        self,
        name: str,
        description: str = '',
        data_type: str = 'bool',
        rules: Optional[List[AndroidPlatformParameterRule]] = None,
        rule_schema_version: int = 1,
        default_value: Optional[AndroidPlatformDataTypes] = None,
    ) -> None:
        self._name = name
        self._description = description
        self._data_type = data_type
        self._rules = rules if rules is not None else []
        self._rule_schema_version = rule_schema_version
        self._default_value = default_value

    @property
    def name(self) -> str:
        """Returns the name of the Android platform parameter.

        Returns:
            str. The parameter name.
        """
        return self._name

    @property
    def description(self) -> str:
        """Returns the description of the Android platform parameter.

        Returns:
            str. The parameter description.
        """
        return self._description

    @property
    def data_type(self) -> str:
        """Returns the data type of the Android platform parameter.

        Returns:
            str. The parameter data type.
        """
        return self._data_type

    @property
    def rules(self) -> List[AndroidPlatformParameterRule]:
        """Returns the ordered rules of the Android platform parameter.

        Returns:
            list(AndroidPlatformParameterRule). The ordered rules.
        """
        return self._rules

    def set_rules(self, new_rules: List[AndroidPlatformParameterRule]) -> None:
        """Sets the ordered rules of this Android platform parameter.

        Args:
            new_rules: list(AndroidPlatformParameterRule). The ordered rules to
                set.
        """
        self._rules = new_rules

    @property
    def rule_schema_version(self) -> int:
        """Returns the schema version of the rules.

        Returns:
            int. The rule schema version.
        """
        return self._rule_schema_version

    @property
    def default_value(self) -> Optional[AndroidPlatformDataTypes]:
        """Returns the default value of the Android platform parameter.

        Returns:
            AndroidPlatformDataTypes|None. The default value for this parameter.
        """
        return self._default_value

    def set_default_value(
        self, default_value: AndroidPlatformDataTypes
    ) -> None:
        """Sets the default value of this Android platform parameter.

        Args:
            default_value: AndroidPlatformDataTypes. The default value to set.
        """
        self._default_value = default_value

    def validate(self) -> None:
        """Validates the name, declared type, default, schema, and rules.

        Raises:
            ValidationError. The parameter configuration is invalid.
        """
        if re.match(self.PARAMETER_NAME_REGEXP, self._name) is None:
            raise utils.ValidationError(
                'Invalid Android platform parameter name \'%s\', expected to '
                'match regexp %s.' % (self._name, self.PARAMETER_NAME_REGEXP)
            )

        if self._default_value is None:
            raise utils.ValidationError(
                'Android platform parameter must have a default value.'
            )

        predicate = self.DATA_TYPE_PREDICATES_DICT.get(self._data_type)
        if predicate is None:
            raise utils.ValidationError(
                'Unsupported Android platform parameter data type \'%s\'.'
                % self._data_type
            )
        if not predicate(self._default_value):
            raise utils.ValidationError(
                'Expected %s, received \'%s\' in default value.'
                % (self._data_type, self._default_value)
            )

        if (
            1 > self._rule_schema_version
            or self._rule_schema_version
            > feconf.CURRENT_ANDROID_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION
        ):
            raise utils.ValidationError(
                'Unsupported Android platform parameter rule schema version '
                '\'%s\'.' % self._rule_schema_version
            )

        for rule in self._rules:
            if not predicate(rule.value_when_matched):
                raise utils.ValidationError(
                    'Expected %s, received \'%s\' in value_when_matched.'
                    % (self._data_type, rule.value_when_matched)
                )
            rule.validate()

    def evaluate(
        self, context: AndroidEvaluationContext
    ) -> AndroidPlatformDataTypes:
        """Returns the first matching rule value or the configured default.

        Args:
            context: AndroidEvaluationContext. The context used to evaluate
                rules.

        Returns:
            AndroidPlatformDataTypes. The first matching rule value or the
            configured default value.
        """
        if self._default_value is None:
            raise utils.ValidationError(
                'Android platform parameter must have a default value.'
            )
        context.validate()
        for rule in self._rules:
            if rule.evaluate(context):
                return rule.value_when_matched
        return self._default_value

    def to_dict(self) -> AndroidPlatformParameterDict:
        """Returns a dict representation of this parameter.

        Returns:
            dict. A dict mapping of all fields of the parameter object.
        """
        if self._default_value is None:
            raise utils.ValidationError(
                'Android platform parameter must have a default value.'
            )
        return {
            'name': self._name,
            'description': self._description,
            'data_type': self._data_type,
            'rules': [rule.to_dict() for rule in self._rules],
            'rule_schema_version': self._rule_schema_version,
            'default_value': self._default_value,
        }

    @classmethod
    def from_dict(
        cls, param_dict: AndroidPlatformParameterDict
    ) -> AndroidPlatformParameter:
        """Returns an AndroidPlatformParameter object from a dict.

        Args:
            param_dict: dict. A dict mapping of all fields of
                AndroidPlatformParameter object.

        Returns:
            AndroidPlatformParameter. The corresponding Android platform
            parameter domain object.

        Note:
            The Android storage model does not persist ``data_type``; when
            reading a model-shaped dictionary, the type is inferred from its
            default value.
        """
        default_value = param_dict.get('default_value')
        data_type = (
            param_dict['data_type']
            if 'data_type' in param_dict
            else cls.DATA_TYPE_BY_DEFAULT_TYPE.get(type(default_value), '')
        )
        return cls(
            param_dict['name'],
            param_dict.get('description', ''),
            data_type,
            [
                AndroidPlatformParameterRule.from_dict(rule_dict)
                for rule_dict in param_dict['rules']
            ],
            param_dict['rule_schema_version'],
            default_value,
        )

    def serialize(self) -> str:
        """Returns this Android platform parameter as a JSON string.

        Returns:
            str. A JSON string representation of this Android platform
            parameter.
        """
        return json.dumps(self.to_dict())

    @classmethod
    def deserialize(cls, json_string: str) -> AndroidPlatformParameter:
        """Returns an Android platform parameter decoded from JSON.

        Args:
            json_string: str. A JSON-encoded string that can be
                decoded into a dictionary representing a PlatformParameter.
                Only call on strings that were created using serialize().

        Returns:
            AndroidPlatformParameter. The corresponding Android platform
            parameter domain object.
        """
        return cls.from_dict(json.loads(json_string))
