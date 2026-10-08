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

import re

from core import feconf, utils
from core.domain import platform_parameter_domain

from typing import Callable, Dict, Final, List, Optional, TypedDict, Union

AndroidPlatformParameterDataTypes = Union[str, int, bool, float]


class AndroidPlatformParameterFilterDict(TypedDict):
    """Dictionary representation of an Android platform parameter filter."""

    type: str
    conditions: List[List[str]]


class AndroidPlatformParameterFilter(
    platform_parameter_domain.PlatformParameterFilter
):
    """Filter domain object supporting Android app version dimensions."""

    SUPPORTED_FILTER_TYPES: Final = ['app_version', 'app_version_flavor']

    @classmethod
    def from_dict(
        cls, filter_dict: AndroidPlatformParameterFilterDict
    ) -> AndroidPlatformParameterFilter:
        """Creates an Android filter from its dictionary representation."""
        return cls(filter_dict['type'], filter_dict['conditions'])


class AndroidPlatformParameterRuleDict(TypedDict):
    """Dictionary representation of an Android platform parameter rule."""

    filters: List[AndroidPlatformParameterFilterDict]
    value_when_matched: AndroidPlatformParameterDataTypes


class AndroidPlatformParameterRule:
    """Domain object for rules in Android platform parameters."""

    def __init__(
        self,
        filters: List[AndroidPlatformParameterFilter],
        value_when_matched: AndroidPlatformParameterDataTypes,
    ) -> None:
        self._filters = filters
        self._value_when_matched = value_when_matched

    @property
    def filters(self) -> List[AndroidPlatformParameterFilter]:
        """Returns the filters in this rule."""
        return self._filters

    @property
    def value_when_matched(self) -> AndroidPlatformParameterDataTypes:
        """Returns this rule's result when it matches."""
        return self._value_when_matched

    def evaluate(
        self, context: platform_parameter_domain.EvaluationContext
    ) -> bool:
        """Returns whether all filters match the Android request context."""
        return all(
            filter_domain.evaluate(context) for filter_domain in self._filters
        )

    def validate(self) -> None:
        """Validates all filters in this rule."""
        for filter_domain in self._filters:
            filter_domain.validate()

    def to_dict(self) -> AndroidPlatformParameterRuleDict:
        """Returns the dictionary representation of this rule."""
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
        """Creates an Android rule from its dictionary representation."""
        return cls(
            [
                AndroidPlatformParameterFilter.from_dict(filter_dict)
                for filter_dict in rule_dict['filters']
            ],
            rule_dict['value_when_matched'],
        )


class AndroidPlatformParameterConfigDict(TypedDict):
    """Dictionary representation of an Android platform parameter config."""

    name: str
    rules: List[AndroidPlatformParameterRuleDict]
    rule_schema_version: int
    default_value: AndroidPlatformParameterDataTypes


class AndroidPlatformParameterConfig:
    """Domain object for Android platform parameter configuration."""

    _DATA_TYPE_PREDICATES: Final[
        Dict[str, Callable[[AndroidPlatformParameterDataTypes], bool]]
    ] = {
        'bool': lambda value: isinstance(value, bool),
        'number': lambda value: isinstance(value, (int, float))
        and not isinstance(value, bool),
        'string': lambda value: isinstance(value, str),
    }
    _DATA_TYPE_BY_DEFAULT_TYPE: Final[Dict[type, str]] = {
        bool: 'bool',
        int: 'number',
        float: 'number',
        str: 'string',
    }
    PARAMETER_NAME_REGEXP: Final = (
        platform_parameter_domain.PlatformParameter.PARAMETER_NAME_REGEXP
    )

    def __init__(
        self,
        name: str,
        rules: List[AndroidPlatformParameterRule],
        rule_schema_version: int,
        default_value: Optional[AndroidPlatformParameterDataTypes],
    ) -> None:
        self._name = name
        self._rules = rules
        self._rule_schema_version = rule_schema_version
        self._default_value = default_value

    @property
    def name(self) -> str:
        """Returns the parameter name."""
        return self._name

    @property
    def rules(self) -> List[AndroidPlatformParameterRule]:
        """Returns the ordered rules."""
        return self._rules

    @property
    def rule_schema_version(self) -> int:
        """Returns the rule schema version."""
        return self._rule_schema_version

    @property
    def default_value(self) -> Optional[AndroidPlatformParameterDataTypes]:
        """Returns the fallback value."""
        return self._default_value

    def validate(self) -> None:
        """Validates the config, rules, default, and their value types."""
        if re.match(self.PARAMETER_NAME_REGEXP, self._name) is None:
            raise utils.ValidationError(
                'Invalid Android platform parameter name.'
            )

        if self._default_value is None:
            raise utils.ValidationError(
                'Android platform parameter must have a default value.'
            )

        data_type = self._DATA_TYPE_BY_DEFAULT_TYPE.get(
            type(self._default_value)
        )
        if data_type is None:
            raise utils.ValidationError(
                'Unsupported Android platform parameter default value type.'
            )

        if (
            self._rule_schema_version
            != feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION
        ):
            raise utils.ValidationError(
                'Unsupported Android platform parameter rule schema version '
                '\'%s\'.' % self._rule_schema_version
            )

        predicate = self._DATA_TYPE_PREDICATES[data_type]
        for rule in self._rules:
            if not predicate(rule.value_when_matched):
                raise utils.ValidationError(
                    'Expected %s, received \'%s\' in value_when_matched.'
                    % (data_type, rule.value_when_matched)
                )
            rule.validate()

    def evaluate(
        self, context: platform_parameter_domain.EvaluationContext
    ) -> AndroidPlatformParameterDataTypes:
        """Returns the first matching rule value or the default value."""
        if self._default_value is None:
            raise utils.ValidationError(
                'Android platform parameter must have a default value.'
            )
        if context.platform_type != 'Android':
            return self._default_value
        for rule in self._rules:
            if rule.evaluate(context):
                return rule.value_when_matched
        return self._default_value

    def to_dict(self) -> AndroidPlatformParameterConfigDict:
        """Returns the dictionary representation of this config."""
        if self._default_value is None:
            raise utils.ValidationError(
                'Android platform parameter must have a default value.'
            )
        return {
            'name': self._name,
            'rules': [rule.to_dict() for rule in self._rules],
            'rule_schema_version': self._rule_schema_version,
            'default_value': self._default_value,
        }

    @classmethod
    def from_dict(
        cls, config_dict: AndroidPlatformParameterConfigDict
    ) -> AndroidPlatformParameterConfig:
        """Creates an Android config from its dictionary representation."""
        web_specific_fields = {'description', 'data_type'}
        if web_specific_fields.intersection(config_dict):
            raise utils.ValidationError(
                'Web-specific fields are not allowed in an Android platform '
                'parameter config.'
            )
        return cls(
            config_dict['name'],
            [
                AndroidPlatformParameterRule.from_dict(rule_dict)
                for rule_dict in config_dict['rules']
            ],
            config_dict['rule_schema_version'],
            config_dict.get('default_value'),
        )
