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

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import re

from constants import constants
from core.domain import change_domain
import feconf
import python_utils
import utils


SERVER_MODES = utils.create_enum('dev', 'test', 'prod') # pylint: disable=invalid-name
FEATURE_STAGES = SERVER_MODES # pylint: disable=invalid-name
DATA_TYPES = utils.create_enum('bool', 'string', 'number') # pylint: disable=invalid-name

ALLOWED_USER_LOCALES = [
    lang_dict['id'] for lang_dict in constants.SUPPORTED_SITE_LANGUAGES]
ALLOWED_SERVER_MODES = [
    SERVER_MODES.dev, SERVER_MODES.test, SERVER_MODES.prod]
ALLOWED_FEATURE_STAGES = [
    FEATURE_STAGES.dev, FEATURE_STAGES.test, FEATURE_STAGES.prod]
ALLOWED_CLIENT_TYPES = ['Web', 'Android']
ALLOWED_BROWSER_TYPES = ['Chrome', 'Edge', 'Safari', 'Firefox', 'Others']
ALLOWED_APP_VERSION_FLAVOR = ['alpha', 'beta', 'test', 'release']

APP_VERSION_WITH_HASH_REGEXP = re.compile(
    r'^(\d+(?:\.\d+)*)(?:-[a-z0-9]+(?:-(.+))?)?$')
APP_VERSION_WITHOUT_HASH_REGEXP = re.compile(r'^(\d+(?:\.\d+)*)$')


class PlatformParameterChange(change_domain.BaseChange):
    """Domain object for changes made to a platform parameter object.

    The allowed commands, together with the attributes:
        - 'edit_rules' (with new_rules)
    """

    CMD_EDIT_RULES = 'edit_rules'
    ALLOWED_COMMANDS = [{
        'name': CMD_EDIT_RULES,
        'required_attribute_names': ['new_rules'],
        'optional_attribute_names': []
    }]


class EvaluationContext(python_utils.OBJECT):
    """Domain object representing the context for parameter evaluation."""

    def __init__(
            self, client_type, browser_type,
            app_version, user_locale, server_mode):
        self._client_type = client_type
        self._browser_type = browser_type
        self._app_version = app_version
        self._user_locale = user_locale
        self._server_mode = server_mode

    @property
    def client_type(self):
        """Returns client type.

        Returns:
            str. The client type, e.g. 'Web', 'Android'.
        """
        return self._client_type

    @property
    def browser_type(self):
        """Returns client browser type.

        Returns:
            str|None. The client browser type, e.g. 'Chrome', 'FireFox',
            'Edge'. None if the client type is native, i.e. Android app.
        """
        return self._browser_type

    @property
    def app_version(self):
        """Returns client application version.

        Returns:
            str|None. The version of native application, e.g. '1.0.0',
            None if the client type is web.
        """
        return self._app_version

    @property
    def user_locale(self):
        """Returns client locale.

        Returns:
            str. The client locale, e.g. 'en', 'es', 'ar'. This must be the id
            of a supported language specified in SUPPORTED_SITE_LANGUAGES in
            constants.ts.
        """
        return self._user_locale

    @property
    def server_mode(self):
        """Returns the server mode of Oppia.

        Returns:
            str. The the server mode of Oppia, must be one of the following:
            'dev', 'test', 'prod'.
        """
        return self._server_mode

    def validate(self):
        """Validates the EvaluationContext domain object."""
        if self._client_type not in ALLOWED_CLIENT_TYPES:
            raise utils.ValidationError(
                'Invalid client type \'%s\', must be one of %s.' % (
                    self._client_type, ALLOWED_CLIENT_TYPES))

        if (
                self._browser_type is not None and
                self._browser_type not in ALLOWED_BROWSER_TYPES):
            raise utils.ValidationError(
                'Invalid browser type \'%s\', must be one of %s.' % (
                    self._browser_type, ALLOWED_BROWSER_TYPES))

        match = APP_VERSION_WITH_HASH_REGEXP.match(self._app_version)
        if self._app_version is not None:
            if match is None:
                raise utils.ValidationError(
                    'Invalid version \'%s\', expected to match regexp %s.' % (
                        self._app_version, APP_VERSION_WITH_HASH_REGEXP))
            elif (
                    match.group(2) is not None and
                    match.group(2) not in ALLOWED_APP_VERSION_FLAVOR):
                raise utils.ValidationError(
                    'Invalid version flavor \'%s\', must be one of %s if'
                    ' specified.' % (
                        match.group(2), ALLOWED_APP_VERSION_FLAVOR))

        if self._user_locale not in ALLOWED_USER_LOCALES:
            raise utils.ValidationError(
                'Invalid user locale \'%s\', must be one of %s.' % (
                    self._user_locale, ALLOWED_USER_LOCALES))

        if self._server_mode not in ALLOWED_SERVER_MODES:
            raise utils.ValidationError(
                'Invalid server mode \'%s\', must be one of %s.' % (
                    self._server_mode, ALLOWED_SERVER_MODES))

    @classmethod
    def from_dict(cls, client_context_dict, server_context_dict):
        """Creates a new EvaluationContext object by combining both client side
        and server side context.

        Args:
            client_context_dict: dict. The client side context.
            server_context_dict: dict. The server side context.

        Returns:
            EvaluationContext. The corresponding EvaluationContext domain
            object.
        """
        return cls(
            client_context_dict.get('client_type'),
            client_context_dict.get('browser_type'),
            client_context_dict.get('app_version'),
            client_context_dict.get('user_locale'),
            server_context_dict.get('server_mode'),
        )


class PlatformParameterFilter(python_utils.OBJECT):
    """Domain object for filters in platform parameters."""

    SUPPORTED_FILTER_TYPES = [
        'server_mode', 'user_locale', 'client_type', 'browser_type',
        'app_version', 'app_version_flavor',
    ]

    SUPPORTED_OP_FOR_FILTERS = {
        'server_mode': ['='],
        'user_locale': ['='],
        'client_type': ['='],
        'browser_type': ['='],
        'app_version_flavor': ['=', '<', '<=', '>', '>='],
        'app_version': ['=', '<', '<=', '>', '>='],
    }

    def __init__(self, filter_type, conditions):
        self._type = filter_type
        self._conditions = conditions

    @property
    def type(self):
        """Returns filter type.

        Returns:
            str. The filter type.
        """
        return self._type

    @property
    def conditions(self):
        """Returns filter conditions.

        Returns:
            list((str, str)). The filter conditions. Each element of the list
            is a 2-tuple (op, value), where op is the operator for comparison,
            value is the value used for comparison.
        """
        return self._conditions

    def evaluate(self, context):
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

    def _evaluate_single_value(self, op, value, context):
        """Tries to match the given context with the filter against the
        given value.

        Args:
            op: str. The operator for comparison, e.g. '='.
            value: str. The value to match against.
            context: EvaluationContext. The context for evaluation.

        Returns:
            bool. True if the filter is matched.
        """
        if op not in self.SUPPORTED_OP_FOR_FILTERS[self._type]:
            raise Exception(
                'Unsupported comparison operator \'%s\' for %s filter, '
                'expected one of %s.' % (
                    op, self._type, self.SUPPORTED_OP_FOR_FILTERS[self._type]))

        matched = False
        if self._type == 'server_mode' and op == '=':
            matched = context.server_mode == value
        elif self._type == 'user_locale' and op == '=':
            matched = context.user_locale == value
        elif self._type == 'client_type' and op == '=':
            matched = context.client_type == value
        elif self._type == 'browser_type' and op == '=':
            matched = context.browser_type == value
        elif self._type == 'app_version_flavor':
            matched = self._match_version_flavor(op, value, context.app_version)
        elif self._type == 'app_version':
            matched = self._match_version_expression(
                op, value, context.app_version)

        return matched

    def validate(self):
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

        if self._type == 'server_mode':
            for _, mode in self._conditions:
                if mode not in ALLOWED_SERVER_MODES:
                    raise utils.ValidationError(
                        'Invalid server mode \'%s\', must be one of %s.' % (
                            mode, ALLOWED_SERVER_MODES))
        elif self._type == 'user_locale':
            for _, locale in self._conditions:
                if locale not in ALLOWED_USER_LOCALES:
                    raise utils.ValidationError(
                        'Invalid user locale \'%s\', must be one of %s.' % (
                            locale, ALLOWED_USER_LOCALES))
        elif self._type == 'client_type':
            for _, client_type in self._conditions:
                if client_type not in ALLOWED_CLIENT_TYPES:
                    raise utils.ValidationError(
                        'Invalid client type \'%s\', must be one of %s.' % (
                            client_type, ALLOWED_CLIENT_TYPES))
        elif self._type == 'app_version_flavor':
            for _, flavor in self._conditions:
                if flavor not in ALLOWED_APP_VERSION_FLAVOR:
                    raise utils.ValidationError(
                        'Invalid app version flavor \'%s\', must be one of'
                        ' %s.' % (flavor, ALLOWED_APP_VERSION_FLAVOR))
        elif self._type == 'app_version':
            for _, version in self._conditions:
                if not APP_VERSION_WITHOUT_HASH_REGEXP.match(version):
                    raise utils.ValidationError(
                        'Invalid version expression \'%s\', expected to match'
                        'regexp %s.' % (
                            version, APP_VERSION_WITHOUT_HASH_REGEXP))

    def to_dict(self):
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
    def from_dict(cls, filter_dict):
        """Returns an PlatformParameterFilter object from a dict.

        Args:
            filter_dict: dict. A dict mapping of all fields of
                PlatformParameterFilter object.

        Returns:
            PlatformParameterFilter. The corresponding PlatformParameterFilter
            domain object.
        """
        return cls(filter_dict['type'], filter_dict['conditions'])

    def _match_version_expression(self, op, value, client_version):
        """Tries to match the version expression against the client version.

        Args:
            op: str. The operator for comparison, e.g. '=', '>'.
            value: str. The version for comparison, e.g. '1.0.1'.
            client_version: str|None. The client version, e.g. '1.0.1-3aebf3h'.

        Returns:
            bool. True if the expression matches the version.
        """
        if client_version is None:
            return False

        match = APP_VERSION_WITH_HASH_REGEXP.match(client_version)
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

    def _is_first_version_smaller(self, version_a, version_b):
        """Compares two version strings, return True if the first version is
        smaller.

        Args:
            version_a: str. The version string (e.g. '1.0.0.0').
            version_b: str. The version string (e.g. '1.0.0.0').

        Returns:
            bool. True if the first version is smaller.
        """
        version_a = version_a.split('.')
        version_b = version_b.split('.')

        for sub_version_a, sub_version_b in python_utils.ZIP(
                version_a, version_b):
            if int(sub_version_a) < int(sub_version_b):
                return True
            elif int(sub_version_a) > int(sub_version_b):
                return False
        return False

    def _match_version_flavor(self, op, flavor, client_version):
        """Matches the client version flavor.

        Args:
            op: str. The operator for comparison, e.g. '=', '>'.
            flavor: str. The flavor to match, e.g. 'alpha', 'beta', 'test',
                'n/a'.
            client_version: str. The version of the client, given in the form
                of '<version>-<hash>-<flavor>'. The hash and flavor of client
                version is optional, if absent, the flavor is considered 'n/a'.

        Returns:
            bool. True is the client_version matches the given flavor using
            the operator.
        """
        match = APP_VERSION_WITH_HASH_REGEXP.match(client_version)
        client_flavor = match.group(2)

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

    def _is_first_flavor_smaller(self, flavor_a, flavor_b):
        """Compares two version flavors that are not 'unknown', return True
        if the first version is smaller in the following ordering:
        'alpha' < 'beta' < 'test' < 'release'

        Args:
            flavor_a: str. The version flavor.
            flavor_b: str. The version flavor.

        Returns:
            bool. True if the first flavor is smaller.
        """
        return (
            ALLOWED_APP_VERSION_FLAVOR.index(flavor_a) <
            ALLOWED_APP_VERSION_FLAVOR.index(flavor_b)
        )


class PlatformParameterRule(python_utils.OBJECT):
    """Domain object for rules in platform parameters."""

    def __init__(self, filters, value_when_matched):
        self._filters = filters
        self._value_when_matched = value_when_matched

    @property
    def filters(self):
        """Returns the filters of the rule.

        Returns:
            list(PlatformParameterFilter). The filters of the rule.
        """
        return self._filters

    @property
    def value_when_matched(self):
        """Returns the value outcome if this rule is matched.

        Returns:
            *. The value outcome.
        """
        return self._value_when_matched

    def evaluate(self, context):
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

    def has_server_mode_filter(self):
        """Checks if the rule has a filter with type 'server_mode'.

        Returns:
            bool. True if the rule has a filter with type 'server_mode'.
        """
        return any(
            filter_domain.type == 'server_mode'
            for filter_domain in self._filters)

    def to_dict(self):
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

    def validate(self):
        """Validates the PlatformParameterRule domain object."""
        for filter_domain_object in self._filters:
            filter_domain_object.validate()

    @classmethod
    def from_dict(cls, rule_dict):
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


class PlatformParameter(python_utils.OBJECT):
    """Domain object for platform parameters."""

    DATA_TYPE_PREDICATES_DICT = {
        DATA_TYPES.bool: lambda x: isinstance(x, bool),
        DATA_TYPES.string: lambda x: isinstance(x, python_utils.BASESTRING),
        DATA_TYPES.number: lambda x: isinstance(x, (float, int)),
    }

    PARAMETER_NAME_REGEXP = r'^[A-Za-z0-9_]{1,100}$'

    def __init__(
            self, name, description, data_type, rules,
            rule_schema_version, default_value, is_feature, feature_stage):
        self._name = name
        self._description = description
        self._data_type = data_type
        self._rules = rules
        self._rule_schema_version = rule_schema_version
        self._default_value = default_value
        self._is_feature = is_feature
        self._feature_stage = feature_stage

    @property
    def name(self):
        """Returns the name of the platform parameter.

        Returns:
            str. The name of the platform parameter.
        """
        return self._name

    @property
    def description(self):
        """Returns the description of the platform parameter.

        Returns:
            str. The description of the platform parameter.
        """
        return self._description

    @property
    def data_type(self):
        """Returns the data type of the platform parameter.

        Returns:
            DATA_TYPES. The data type of the platform parameter.
        """
        return self._data_type

    @property
    def rules(self):
        """Returns the rules of the platform parameter.

        Returns:
            list(PlatformParameterRules). The rules of the platform parameter.
        """
        return self._rules

    def set_rules(self, new_rules):
        """Sets the rules of the PlatformParameter.

        Args:
            new_rules: list(PlatformParameterRules). The new rules of the
                parameter.
        """
        self._rules = new_rules

    @property
    def rule_schema_version(self):
        """Returns the schema version of the rules.

        Returns:
            int. The schema version of the rules.
        """
        return self._rule_schema_version

    @property
    def default_value(self):
        """Returns the default value of the platform parameter.

        Returns:
            *. The default value of the platform parameter.
        """
        return self._default_value

    @property
    def is_feature(self):
        """Returns whether this parameter is also a feature flag.

        Returns:
            bool. True if the parameter is a feature flag.
        """
        return self._is_feature

    @property
    def feature_stage(self):
        """Returns the stage of the feature flag.

        Returns:
            FEATURE_STAGES|None. The stage of the feature flag, None if the
            parameter isn't a feature flag.
        """
        return self._feature_stage

    def validate(self):
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
            if not rule.has_server_mode_filter():
                raise utils.ValidationError(
                    'All rules must have a server_mode filter.')
            rule.validate()

        if self._is_feature:
            self._validate_feature_flag()

    def evaluate(self, context):
        """Evaluates the value of the platform parameter in the given context.
        The value of first matched rule is returned as the result.

        Args:
            context: EvaluationContext. The context for evaluation.

        Returns:
            *. The evaluate result of the platform parameter.
        """
        for rule in self._rules:
            if rule.evaluate(context):
                return rule.value_when_matched
        return self._default_value

    def to_dict(self):
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
            'default_value': self._default_value,
            'is_feature': self._is_feature,
            'feature_stage': self._feature_stage
        }

    def _validate_feature_flag(self):
        """Validates the PlatformParameter domain object that is a feature
        flag.
        """
        if self._data_type != DATA_TYPES.bool:
            raise utils.ValidationError(
                'Data type of feature flags must be bool, got \'%s\' '
                'instead.' % self._data_type)
        if self._feature_stage not in ALLOWED_FEATURE_STAGES:
            raise utils.ValidationError(
                'Invalid feature stage, got \'%s\', expected one of %s.' % (
                    self._feature_stage, ALLOWED_FEATURE_STAGES))

        enabling_rules = [
            rule for rule in self._rules if rule.value_when_matched]
        for rule in enabling_rules:
            server_mode_filters = [
                server_mode_filter for server_mode_filter in rule.filters
                if server_mode_filter.type == 'server_mode']
            for server_mode_filter in server_mode_filters:
                server_modes = [
                    value for _, value in server_mode_filter.conditions]
                if self._feature_stage == FEATURE_STAGES.dev:
                    if (
                            SERVER_MODES.test in server_modes or
                            SERVER_MODES.prod in server_modes):
                        raise utils.ValidationError(
                            'Feature in dev stage cannot be enabled in test or'
                            ' production environment.')
                elif self._feature_stage == FEATURE_STAGES.test:
                    if SERVER_MODES.prod in server_modes:
                        raise utils.ValidationError(
                            'Feature in test stage cannot be enabled in '
                            'production environment.')

    @classmethod
    def from_dict(cls, param_dict):
        """Returns an PlatformParameter object from a dict.

        Args:
            param_dict: dict. A dict mapping of all fields of
                PlatformParameter object.

        Returns:
            PlatformParameter. The corresponding PlatformParameter domain
            object.
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
            param_dict['is_feature'],
            param_dict['feature_stage'],
        )

    @staticmethod
    def get_memcache_key(name):
        """Returns the key for the platform parameter in memcache service.

        Args:
            name: str. The name of the platform parameter.

        Returns:
            str. The key for memcache service.
        """
        return 'PLATFORM_PARAMETER:%s' % name
