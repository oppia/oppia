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

"""Domain objects for platform parameters."""

from __future__ import annotations

import enum
import json
import re

from core import feconf
from core import utils
from core.constants import constants
from core.domain import change_domain

from typing import (
    Callable, Dict, Final, List, Optional, Pattern, TypedDict, Union)


class ServerMode(enum.Enum):
    """Enum for server modes."""

    DEV = 'dev'
    TEST = 'test'
    PROD = 'prod'


FeatureStages = ServerMode

# Union type defined from allowed types that a platform parameter can contain
# for its data types.
PlatformDataTypes = Union[str, int, bool, float]


class DataTypes(enum.Enum):
    """Enum for data types."""

    BOOL = 'bool'
    STRING = 'string'
    NUMBER = 'number'


ALLOWED_SERVER_MODES: Final = [
    ServerMode.DEV.value,
    ServerMode.TEST.value,
    ServerMode.PROD.value
]
ALLOWED_FEATURE_STAGES: Final = [
    FeatureStages.DEV.value,
    FeatureStages.TEST.value,
    FeatureStages.PROD.value
]
ALLOWED_PLATFORM_TYPES: List[str] = (
    constants.PLATFORM_PARAMETER_ALLOWED_PLATFORM_TYPES
)
ALLOWED_APP_VERSION_FLAVORS: List[str] = (
    constants.PLATFORM_PARAMETER_ALLOWED_APP_VERSION_FLAVORS
)

APP_VERSION_WITH_HASH_REGEXP: Pattern[str] = re.compile(
    constants.PLATFORM_PARAMETER_APP_VERSION_WITH_HASH_REGEXP
)
APP_VERSION_WITHOUT_HASH_REGEXP: Pattern[str] = re.compile(
    constants.PLATFORM_PARAMETER_APP_VERSION_WITHOUT_HASH_REGEXP
)


class PlatformParameterChange(change_domain.BaseChange):
    """Domain object for changes made to a platform parameter object.

    The allowed commands, together with the attributes:
        - 'edit_rules' (with new_rules)
    """

    CMD_EDIT_RULES: Final = 'edit_rules'
    ALLOWED_COMMANDS: List[feconf.ValidCmdDict] = [{
        'name': CMD_EDIT_RULES,
        'required_attribute_names': ['new_rules'],
        'optional_attribute_names': [],
        'user_id_attribute_names': [],
        'allowed_values': {},
        'deprecated_values': {}
    }]


class EditRulesPlatformParameterCmd(PlatformParameterChange):
    """Class representing the PlatformParameterChange's
    CMD_EDIT_RULES command.
    """

    new_rules: List[str]


class ClientSideContextDict(TypedDict):
    """Dictionary representing the client's side Context object."""

    platform_type: Optional[str]
    app_version: Optional[str]


class ServerSideContextDict(TypedDict):
    """Dictionary representing the server's side Context object."""

    server_mode: ServerMode


class EvaluationContext:
    """Domain object representing the context for parameter evaluation."""

    def __init__(
        self,
        platform_type: Optional[str],
        app_version: Optional[str],
        server_mode: ServerMode
    ) -> None:
        self._platform_type = platform_type
        self._app_version = app_version
        self._server_mode = server_mode

    @property
    def platform_type(self) -> Optional[str]:
        """Returns platform type.

        Returns:
            str|None. The platform type, e.g. 'Web', 'Android', 'Backend'.
        """
        return self._platform_type

    @property
    def app_version(self) -> Optional[str]:
        # TODO(#11208): Update the documentation below to reflect the change
        # when the GAE app version is used for web & backend.
        """Returns client application version.

        Returns:
            str|None. The version of native application, e.g. '1.0.0',
            None if the platform type is Web.
        """
        return self._app_version

    @property
    def server_mode(self) -> ServerMode:
        """Returns the server mode of Oppia.

        Returns:
            Enum(ServerMode). The the server mode of Oppia,
            must be one of the following: dev, test, prod.
        """
        return self._server_mode

    @property
    def is_valid(self) -> bool:
        """Returns whether this context object is valid for evaluating
        parameters. An invalid context object usually indicates that one of the
        object's required fields is missing or an unexpected value. Note that
        objects which are not valid will still pass validation. This method
        should return true and validate() should not raise an exception before
        using this object for platform evaluation.

        Returns:
            bool. Whether this context object can be used for evaluating
            parameters.
        """
        return (
            self._platform_type is not None and
            self._platform_type in ALLOWED_PLATFORM_TYPES)

    def validate(self) -> None:
        """Validates the EvaluationContext domain object, raising an exception
        if the object is in an irrecoverable error state.
        """
        if self._app_version is not None:
            match = APP_VERSION_WITH_HASH_REGEXP.match(self._app_version)
            if match is None:
                raise utils.ValidationError(
                    'Invalid version \'%s\', expected to match regexp %s.' % (
                        self._app_version, APP_VERSION_WITH_HASH_REGEXP))

            if (
                    match.group(2) is not None and
                    match.group(2) not in ALLOWED_APP_VERSION_FLAVORS):
                raise utils.ValidationError(
                    'Invalid version flavor \'%s\', must be one of %s if'
                    ' specified.' % (
                        match.group(2), ALLOWED_APP_VERSION_FLAVORS))

        if self._server_mode.value not in ALLOWED_SERVER_MODES:
            raise utils.ValidationError(
                'Invalid server mode \'%s\', must be one of %s.' % (
                    self._server_mode.value, ALLOWED_SERVER_MODES))

    @classmethod
    def from_dict(
        cls,
        client_context_dict: ClientSideContextDict,
        server_context_dict: ServerSideContextDict
    ) -> EvaluationContext:
        """Creates a new EvaluationContext object by combining both client side
        and server side context.

        Args:
            client_context_dict: dict. The client side context.
            server_context_dict: dict. The server side context.

        Returns:
            EvaluationContext. The corresponding EvaluationContext domain
            object.
        """
        # TODO(#11208): After `app version` and `browser type` are set properly
        # in the codebase as a part of the server & client context. Please
        # convert `.get()` method to `[]`, so that we have a more strict method
        # to fetch dictionary keys.
        return cls(
            client_context_dict['platform_type'],
            client_context_dict.get('app_version'),
            server_context_dict['server_mode'],
        )


class PlatformParameterFilterDict(TypedDict):
    """Dictionary representing the PlatformParameterFilter object."""

    type: str
    conditions: List[List[str]]


class PlatformParameterFilter:
    """Domain object for filters in platform parameters."""

    SUPPORTED_FILTER_TYPES: Final = [
        'server_mode', 'platform_type', 'app_version', 'app_version_flavor',
    ]

    SUPPORTED_OP_FOR_FILTERS: Final = {
        'platform_type': ['='],
        'app_version_flavor': ['=', '<', '<=', '>', '>='],
        'app_version': ['=', '<', '<=', '>', '>='],
    }

    def __init__(
        self,
        filter_type: str,
        conditions: List[List[str]]
    ) -> None:
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
            for comparison, value is the value used for comparison.
        """
        return self._conditions

    def evaluate(self, context: EvaluationContext) -> bool:
        """Tries to match the given context with the filter against its
        value(s).

        Args:
            context: EvaluationContext. The context for evaluation.

        Returns:
            bool. True if the filter is matched.
        """
        return any(
            self._evaluate_single_value(op, value, context)
            for op, value in self._conditions
        )

    def _evaluate_single_value(
        self,
        op: str,
        value: str,
        context: EvaluationContext
    ) -> bool:
        """Tries to match the given context with the filter against the
        given value.

        Args:
            op: str. The operator for comparison, e.g. '='.
            value: str. The value to match against.
            context: EvaluationContext. The context for evaluation.

        Returns:
            bool. True if the filter is matched.

        Raises:
            Exception. Given operator is not supported.
        """
        if self._type == 'platform_type' and op != '=':
            raise Exception(
                'Unsupported comparison operator \'%s\' for %s filter, '
                'expected one of %s.' % (
                    op, self._type, self.SUPPORTED_OP_FOR_FILTERS[self._type]))

        matched = False
        if self._type == 'platform_type' and op == '=':
            matched = context.platform_type == value
        elif self._type == 'app_version_flavor':
            # Ruling out the possibility of None for mypy type checking.
            assert context.app_version is not None
            matched = self._match_version_flavor(op, value, context.app_version)
        elif self._type == 'app_version':
            matched = self._match_version_expression(
                op, value, context.app_version)

        return matched

    def validate(self) -> None:
        """Validates the PlatformParameterFilter domain object."""
        if self._type not in self.SUPPORTED_FILTER_TYPES:
            raise utils.ValidationError(
                'Unsupported filter type \'%s\'' % self._type)

        for op, _ in self._conditions:
            if op not in self.SUPPORTED_OP_FOR_FILTERS[self._type]:
                raise utils.ValidationError(
                    'Unsupported comparison operator \'%s\' for %s filter, '
                    'expected one of %s.' % (
                        op, self._type,
                        self.SUPPORTED_OP_FOR_FILTERS[self._type]))

        if self._type == 'platform_type':
            for _, platform_type in self._conditions:
                if platform_type not in ALLOWED_PLATFORM_TYPES:
                    raise utils.ValidationError(
                        'Invalid platform type \'%s\', must be one of %s.' % (
                            platform_type, ALLOWED_PLATFORM_TYPES))
        elif self._type == 'app_version_flavor':
            for _, flavor in self._conditions:
                if flavor not in ALLOWED_APP_VERSION_FLAVORS:
                    raise utils.ValidationError(
                        'Invalid app version flavor \'%s\', must be one of'
                        ' %s.' % (flavor, ALLOWED_APP_VERSION_FLAVORS))
        elif self._type == 'app_version':
            for _, version in self._conditions:
                if not APP_VERSION_WITHOUT_HASH_REGEXP.match(version):
                    raise utils.ValidationError(
                        'Invalid version expression \'%s\', expected to match'
                        'regexp %s.' % (
                            version, APP_VERSION_WITHOUT_HASH_REGEXP))

    def to_dict(self) -> PlatformParameterFilterDict:
        """Returns a dict representation of the PlatformParameterFilter domain
        object.

        Returns:
            dict. A dict mapping of all fields of PlatformParameterFilter
            object.
        """
        return {
            'type': self._type,
            'conditions': self._conditions,
        }

    @classmethod
    def from_dict(
        cls, filter_dict: PlatformParameterFilterDict
    ) -> PlatformParameterFilter:
        """Returns an PlatformParameterFilter object from a dict.

        Args:
            filter_dict: dict. A dict mapping of all fields of
                PlatformParameterFilter object.

        Returns:
            PlatformParameterFilter. The corresponding PlatformParameterFilter
            domain object.
        """
        return cls(filter_dict['type'], filter_dict['conditions'])

    def _match_version_expression(
        self,
        op: str,
        value: str,
        client_version: Optional[str]
    ) -> bool:
        """Tries to match the version expression against the client version.

        Args:
            op: str. The operator for comparison, e.g. '=', '>'.
            value: str. The version for comparison, e.g. '1.0.1'.
            client_version: str|None. The client version, e.g. '1.0.1-3aebf3h'.

        Returns:
            bool. True if the expression matches the version.

        Raises:
            Exception. Given operator is not supported.
        """
        if client_version is None:
            return False

        match = APP_VERSION_WITH_HASH_REGEXP.match(client_version)
        # Ruling out the possibility of None for mypy type checking.
        assert match is not None
        client_version_without_hash = match.group(1)

        is_equal = value == client_version_without_hash
        is_client_version_smaller = self._is_first_version_smaller(
            client_version_without_hash, value)
        is_client_version_larger = self._is_first_version_smaller(
            value, client_version_without_hash
        )
        if op == '=':
            return is_equal
        elif op == '<':
            return is_client_version_smaller
        elif op == '<=':
            return is_equal or is_client_version_smaller
        elif op == '>':
            return is_client_version_larger
        elif op == '>=':
            return is_equal or is_client_version_larger
        else:
            raise Exception(
                'Unsupported comparison operator \'%s\' for %s filter, '
                'expected one of %s.' % (
                    op, self._type, self.SUPPORTED_OP_FOR_FILTERS[self._type]))

    def _is_first_version_smaller(
        self,
        version_a: str,
        version_b: str
    ) -> bool:
        """Compares two version strings, return True if the first version is
        smaller.

        Args:
            version_a: str. The version string (e.g. '1.0.0').
            version_b: str. The version string (e.g. '1.0.0').

        Returns:
            bool. True if the first version is smaller.
        """
        splitted_version_a = version_a.split('.')
        splitted_version_b = version_b.split('.')

        for sub_version_a, sub_version_b in zip(
            splitted_version_a,
            splitted_version_b
        ):
            if int(sub_version_a) < int(sub_version_b):
                return True
            elif int(sub_version_a) > int(sub_version_b):
                return False
        return False

    def _match_version_flavor(
        self,
        op: str,
        flavor: str,
        client_version: str
    ) -> bool:
        """Matches the client version flavor.

        Args:
            op: str. The operator for comparison, e.g. '=', '>'.
            flavor: str. The flavor to match, e.g. 'alpha', 'beta', 'test',
                'release'.
            client_version: str. The version of the client, given in the form
                of '<version>-<hash>-<flavor>'. The hash and flavor of client
                version is optional, but if absent, no flavor filter will
                match to it.

        Returns:
            bool. True is the client_version matches the given flavor using
            the operator.

        Raises:
            Exception. Given operator is not supported.
        """
        match = APP_VERSION_WITH_HASH_REGEXP.match(client_version)
        # Ruling out the possibility of None for mypy type checking.
        assert match is not None
        client_flavor = match.group(2)

        # An unspecified client flavor means no flavor-based filters should
        # match to it.
        if client_flavor is None:
            return False

        is_equal = flavor == client_flavor
        is_client_flavor_smaller = self._is_first_flavor_smaller(
            client_flavor, flavor)
        is_client_flavor_larger = self._is_first_flavor_smaller(
            flavor, client_flavor)

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
                'expected one of %s.' % (
                    op, self._type, self.SUPPORTED_OP_FOR_FILTERS[self._type]))

    def _is_first_flavor_smaller(
        self,
        flavor_a: str,
        flavor_b: str
    ) -> bool:
        """Compares two version flavors, return True if the first version is
        smaller in the following ordering:
        'test' < 'alpha' < 'beta' < 'release'.

        Args:
            flavor_a: str. The version flavor.
            flavor_b: str. The version flavor.

        Returns:
            bool. True if the first flavor is smaller.
        """
        return (
            ALLOWED_APP_VERSION_FLAVORS.index(flavor_a) <
            ALLOWED_APP_VERSION_FLAVORS.index(flavor_b)
        )


class PlatformParameterRuleDict(TypedDict):
    """Dictionary representing the PlatformParameterRule object."""

    filters: List[PlatformParameterFilterDict]
    value_when_matched: PlatformDataTypes


class PlatformParameterRule:
    """Domain object for rules in platform parameters."""

    def __init__(
        self,
        filters: List[PlatformParameterFilter],
        value_when_matched: PlatformDataTypes
    ) -> None:
        self._filters = filters
        self._value_when_matched = value_when_matched

    @property
    def filters(self) -> List[PlatformParameterFilter]:
        """Returns the filters of the rule.

        Returns:
            list(PlatformParameterFilter). The filters of the rule.
        """
        return self._filters

    @property
    def value_when_matched(self) -> PlatformDataTypes:
        """Returns the value outcome if this rule is matched.

        Returns:
            *. The value outcome.
        """
        return self._value_when_matched

    def evaluate(self, context: EvaluationContext) -> bool:
        """Tries to match the given context with the rule against its filter(s).
        A rule is matched when all its filters are matched.

        Args:
            context: EvaluationContext. The context for evaluation.

        Returns:
            bool. True if the rule is matched.
        """
        return all(
            filter_domain.evaluate(context)
            for filter_domain in self._filters)

    def to_dict(self) -> PlatformParameterRuleDict:
        """Returns a dict representation of the PlatformParameterRule domain
        object.

        Returns:
            dict. A dict mapping of all fields of PlatformParameterRule
            object.
        """
        return {
            'filters': [
                filter_domain.to_dict() for filter_domain in self._filters],
            'value_when_matched': self._value_when_matched,
        }

    def validate(self) -> None:
        """Validates the PlatformParameterRule domain object."""
        for filter_domain_object in self._filters:
            filter_domain_object.validate()

    @classmethod
    def from_dict(
        cls, rule_dict: PlatformParameterRuleDict
    ) -> PlatformParameterRule:
        """Returns an PlatformParameterRule object from a dict.

        Args:
            rule_dict: dict. A dict mapping of all fields of
                PlatformParameterRule object.

        Returns:
            PlatformParameterRule. The corresponding PlatformParameterRule
            domain object.
        """
        return cls(
            [
                PlatformParameterFilter.from_dict(filter_dict)
                for filter_dict in rule_dict['filters']],
            rule_dict['value_when_matched'],
        )


class PlatformParameterDict(TypedDict):
    """Dictionary representing the PlatformParameter object."""

    name: str
    description: str
    data_type: str
    rules: List[PlatformParameterRuleDict]
    rule_schema_version: int
    default_value: PlatformDataTypes


class PlatformParameter:
    """Domain object for platform parameters."""

    DATA_TYPE_PREDICATES_DICT: (
        Dict[str, Callable[[PlatformDataTypes], bool]]
    ) = {
        DataTypes.BOOL.value: lambda x: isinstance(x, bool),
        DataTypes.STRING.value: lambda x: isinstance(x, str),
        DataTypes.NUMBER.value: lambda x: isinstance(x, (float, int)),
    }

    PARAMETER_NAME_REGEXP: Final = r'^[A-Za-z0-9_]{1,100}$'

    def __init__(
        self,
        name: str,
        description: str,
        data_type: str,
        rules: List[PlatformParameterRule],
        rule_schema_version: int,
        default_value: PlatformDataTypes
    ) -> None:
        self._name = name
        self._description = description
        self._data_type = data_type
        self._rules = rules
        self._rule_schema_version = rule_schema_version
        self._default_value = default_value

    @property
    def name(self) -> str:
        """Returns the name of the platform parameter.

        Returns:
            str. The name of the platform parameter.
        """
        return self._name

    @property
    def description(self) -> str:
        """Returns the description of the platform parameter.

        Returns:
            str. The description of the platform parameter.
        """
        return self._description

    @property
    def data_type(self) -> str:
        """Returns the data type of the platform parameter.

        Returns:
            DATA_TYPES. The data type of the platform parameter.
        """
        return self._data_type

    @property
    def rules(self) -> List[PlatformParameterRule]:
        """Returns the rules of the platform parameter.

        Returns:
            list(PlatformParameterRules). The rules of the platform parameter.
        """
        return self._rules

    def set_rules(self, new_rules: List[PlatformParameterRule]) -> None:
        """Sets the rules of the PlatformParameter.

        Args:
            new_rules: list(PlatformParameterRules). The new rules of the
                parameter.
        """
        self._rules = new_rules

    @property
    def rule_schema_version(self) -> int:
        """Returns the schema version of the rules.

        Returns:
            int. The schema version of the rules.
        """
        return self._rule_schema_version

    @property
    def default_value(self) -> PlatformDataTypes:
        """Returns the default value of the platform parameter.

        Returns:
            *. The default value of the platform parameter.
        """
        return self._default_value

    def set_default_value(self, default_value: PlatformDataTypes) -> None:
        """Sets the default value of the PlatformParameter.

        Args:
            default_value: PlatformDataTypes. The new default value of the
                parameter.
        """
        self._default_value = default_value

    def validate(self) -> None:
        """Validates the PlatformParameter domain object."""
        if re.match(self.PARAMETER_NAME_REGEXP, self._name) is None:
            raise utils.ValidationError(
                'Invalid parameter name \'%s\', expected to match regexp '
                '%s.' % (self._name, self.PARAMETER_NAME_REGEXP))

        if self._data_type not in self.DATA_TYPE_PREDICATES_DICT:
            raise utils.ValidationError(
                'Unsupported data type \'%s\'.' % self._data_type)

        predicate = self.DATA_TYPE_PREDICATES_DICT[self.data_type]
        if not predicate(self._default_value):
            raise utils.ValidationError(
                'Expected %s, received \'%s\' in default value.' % (
                    self._data_type, self._default_value))
        for rule in self._rules:
            if not predicate(rule.value_when_matched):
                raise utils.ValidationError(
                    'Expected %s, received \'%s\' in value_when_matched.' % (
                        self._data_type, rule.value_when_matched))
            rule.validate()

    def evaluate(
        self, context: EvaluationContext
    ) -> PlatformDataTypes:
        """Evaluates the value of the platform parameter in the given context.
        The value of first matched rule is returned as the result.

        Note that if the provided context is in an invalid state (e.g. its
        is_valid property returns false) then this parameter will defer to its
        default value since it may not be safe to partially evaluate the
        parameter for an unrecognized or partially recognized context.

        Args:
            context: EvaluationContext. The context for evaluation.

        Returns:
            *. The evaluate result of the platform parameter.
        """
        if context.is_valid:
            for rule in self._rules:
                if rule.evaluate(context):
                    return rule.value_when_matched
        return self._default_value

    def to_dict(self) -> PlatformParameterDict:
        """Returns a dict representation of the PlatformParameter domain
        object.

        Returns:
            dict. A dict mapping of all fields of PlatformParameter object.
        """
        return {
            'name': self._name,
            'description': self._description,
            'data_type': self._data_type,
            'rules': [rule.to_dict() for rule in self._rules],
            'rule_schema_version': self._rule_schema_version,
            'default_value': self._default_value
        }

    @classmethod
    def from_dict(cls, param_dict: PlatformParameterDict) -> PlatformParameter:
        """Returns an PlatformParameter object from a dict.

        Args:
            param_dict: dict. A dict mapping of all fields of
                PlatformParameter object.

        Returns:
            PlatformParameter. The corresponding PlatformParameter domain
            object.

        Raises:
            Exception. Given schema version is not supported.
        """
        if (param_dict['rule_schema_version'] !=
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION):
            # NOTE: When there's a new rule schema version, a new method with
            # name of the form '_convert_rule_v1_dict_to_v2_dict` should be
            # added to the class and called here to convert the rule dicts to
            # the latest schema.
            raise Exception(
                'Current platform parameter rule schema version is v%s, '
                'received v%s, and there\'s no convert method from v%s to '
                'v%s.' % (
                    feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION,
                    param_dict['rule_schema_version'],
                    feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION,
                    param_dict['rule_schema_version']))

        return cls(
            param_dict['name'],
            param_dict['description'],
            param_dict['data_type'],
            [
                PlatformParameterRule.from_dict(rule_dict)
                for rule_dict in param_dict['rules']],
            param_dict['rule_schema_version'],
            param_dict['default_value'],
        )

    def serialize(self) -> str:
        """Returns the object serialized as a JSON string.

        Returns:
            str. JSON-encoded string encoding all of the information composing
            the object.
        """
        platform_parameter_dict = self.to_dict()
        return json.dumps(platform_parameter_dict)

    @classmethod
    def deserialize(cls, json_string: str) -> PlatformParameter:
        """Returns a PlatformParameter domain object decoded from a JSON
        string.

        Args:
            json_string: str. A JSON-encoded string that can be
                decoded into a dictionary representing a PlatformParameter.
                Only call on strings that were created using serialize().

        Returns:
            PlatformParameter. The corresponding PlatformParameter domain
            object.
        """
        platform_parameter_dict = json.loads(json_string)
        platform_parameter = cls.from_dict(platform_parameter_dict)
        return platform_parameter
