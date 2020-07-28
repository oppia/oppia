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
from core.platform import models
import feconf
import python_utils
import utils


(config_models,) = models.Registry.import_models(
    [models.NAMES.config])
memcache_services = models.Registry.import_memcache_services()

SERVER_MODES = utils.create_enum('dev', 'test', 'prod') # pylint: disable=invalid-name
FEATURE_STAGES = SERVER_MODES # pylint: disable=invalid-name

ALLOWED_USER_LOCALES = [
    lang_dict['id'] for lang_dict in constants.SUPPORTED_SITE_LANGUAGES]

ALLOWED_SERVER_MODES = [
    SERVER_MODES.dev, SERVER_MODES.test, SERVER_MODES.prod]

ALLOWED_FEATURE_STAGES = [
    FEATURE_STAGES.dev, FEATURE_STAGES.test, FEATURE_STAGES.prod]

ALLOWED_CLIENT_TYPE = ['Web', 'Native']


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

    APP_VERSION_REGEXP = re.compile(r'^\d+(?:\.\d+)*$')

    def __init__(
            self, client_platform, client_type, browser_type,
            app_version, user_locale, server_mode):
        self._client_platform = client_platform
        self._client_type = client_type
        self._browser_type = browser_type
        self._app_version = app_version
        self._user_locale = user_locale
        self._server_mode = server_mode

    @property
    def client_platform(self):
        """Returns client platform.

        Returns:
            str. The client platform, e.g. 'Windows', 'Linux', 'Android'.
        """
        return self._client_platform

    @property
    def client_type(self):
        """Returns client type.

        Returns:
            str. The client type, e.g. 'Web', 'Native'.
        """
        return self._client_type

    @property
    def browser_type(self):
        """Returns client browser type.

        Returns:
            str|None. The client browser type, e.g. 'Chrome', 'FireFox',
            'Edge'. None if the client is a native app.
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
        if self._client_type not in ALLOWED_CLIENT_TYPE:
            raise utils.ValidationError(
                'Invalid client type %s, must be one of %s.' % (
                    self._client_type, ALLOWED_CLIENT_TYPE))
        if (
                self._app_version is not None and
                self.APP_VERSION_REGEXP.match(self._app_version) is None):
            raise utils.ValidationError(
                'Invalid version %s, expected to match regexp %s' % (
                    self._app_version, self.APP_VERSION_REGEXP))
        if self._user_locale not in ALLOWED_USER_LOCALES:
            raise utils.ValidationError(
                'Invalid user locale %s, must be one of %s.' % (
                    self._user_locale, ALLOWED_USER_LOCALES))
        if self._server_mode not in ALLOWED_SERVER_MODES:
            raise utils.ValidationError(
                'Invalid server mode %s, must be one of %s.' % (
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
            client_context_dict.get('client_platform'),
            client_context_dict.get('client_type'),
            client_context_dict.get('browser_type'),
            client_context_dict.get('app_version'),
            client_context_dict.get('user_locale'),
            server_context_dict.get('server_mode'),
        )


class PlatformParameterFilter(python_utils.OBJECT):
    """Domain object for filters in platform parameters."""

    SUPPORTED_FILTER_TYPE = [
        'server_mode', 'user_locale', 'client_platform', 'client_type',
        'browser_type', 'app_version',
    ]
    VERSION_EXPR_REGEXP = re.compile(r'^(>|<|=|>=|<=)(\d+(?:\.\d+)*)$')

    def __init__(self, filter_type, filter_value):
        self._type = filter_type
        self._value = filter_value

    @property
    def type(self):
        """Returns filter type.

        Returns:
            str. The filter type.
        """
        return self._type

    @property
    def value(self):
        """Returns filter value.

        Returns:
            *. The filter value.
        """
        return self._value

    def evaluate(self, context):
        """Tries to match the given context with the filter against its
        value(s).

        Args:
            context: EvaluationContext. The context for evaluation.

        Returns:
            bool. True if the filter is matched.
        """
        if isinstance(self._value, list):
            for element in self._value:
                is_matched = self._evaluate_single_value(element, context)
                if is_matched:
                    return True
            return False
        else:
            return self._evaluate_single_value(self._value, context)

    def _evaluate_single_value(self, value, context):
        """Tries to match the given context with the filter against the
        given value.

        Args:
            value: str. The value to match against.
            context: EvaluationContext. The context for evaluation.

        Returns:
            bool. True if the filter is matched.
        """
        matched = False
        if self._type == 'server_mode':
            matched = context.server_mode == value
        elif self._type == 'user_locale':
            matched = context.user_locale == value
        elif self._type == 'client_platform':
            matched = context.client_platform == value
        elif self._type == 'client_type':
            matched = context.client_type == value
        elif self._type == 'browser_type':
            matched = context.browser_type == value
        elif self._type == 'app_version':
            if context.app_version is not None:
                matched = self._match_version_expression(
                    value, context.app_version)
        return matched

    def to_dict(self):
        """Returns a dict representation of the PlatformParameterFilter domain
        object.

        Returns:
            dict. A dict mapping of all fields of PlatformParameterFilter
            object.
        """
        return {
            'type': self._type,
            'value': self._value,
        }

    def validate(self):
        """Validates the PlatformParameterFilter domain object."""
        if self._type not in self.SUPPORTED_FILTER_TYPE:
            raise utils.ValidationError(
                'Unsupported filter type %s' % self._type)

        if isinstance(self._value, list):
            values = self._value
        else:
            values = [self._value]

        if self._type == 'server_mode':
            for mode in values:
                if mode not in ALLOWED_SERVER_MODES:
                    raise utils.ValidationError(
                        'Invalid server mode %s, must be one of %s.' % (
                            mode, ALLOWED_SERVER_MODES))
        elif self._type == 'user_locale':
            for locale in values:
                if locale not in ALLOWED_USER_LOCALES:
                    raise utils.ValidationError(
                        'Invalid user locale %s, must be one of %s.' % (
                            locale, ALLOWED_USER_LOCALES))
        elif self._type == 'client_type':
            for client_type in values:
                if client_type not in ALLOWED_CLIENT_TYPE:
                    raise utils.ValidationError(
                        'Invalid client type %s, must be one of %s.' % (
                            client_type, ALLOWED_CLIENT_TYPE))
        elif self._type == 'app_version':
            for version_expr in values:
                if (
                        version_expr is not None and
                        not self.VERSION_EXPR_REGEXP.match(version_expr)):
                    raise utils.ValidationError(
                        'Invalid version expression %s, expected to match'
                        'regexp %s.' % (
                            version_expr, self.VERSION_EXPR_REGEXP))

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
        return cls(filter_dict['type'], filter_dict['value'])

    @classmethod
    def _match_version_expression(cls, expr, client_version):
        """Tries to match the version expression against the client version.

        Args:
            expr: str. The version expression (e.g. '>=1.0.0').
            client_version: str. The client version (e.g. '1.0.1').

        Returns:
            bool. True if the expression matches the version.
        """
        match = cls.VERSION_EXPR_REGEXP.match(expr)
        if match:
            op, version = match.groups()

            is_equal = version == client_version
            is_client_version_smaller = cls._is_first_version_smaller(
                client_version, version)
            is_client_version_larger = cls._is_first_version_smaller(
                version, client_version
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
        return False

    @staticmethod
    def _is_first_version_smaller(version_a, version_b):
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
        if len(version_a) < len(version_b):
            version_a += ['0'] * (len(version_b) - len(version_a))
        elif len(version_a) > len(version_b):
            version_b += ['0'] * (len(version_a) - len(version_b))

        for sub_version_a, sub_version_b in python_utils.ZIP(
                version_a, version_b):
            if int(sub_version_a) < int(sub_version_b):
                return True
            elif int(sub_version_a) > int(sub_version_b):
                return False
        return False


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
            - bool. True if the rule is matched.
        """
        are_all_filters_matched = all(
            filter_domain.evaluate(context)
            for filter_domain in self._filters)
        if are_all_filters_matched:
            return True
        return False

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
    def from_dict(cls, rule_dict, schema_version):
        """Returns an PlatformParameterRule object from a dict.

        Args:
            rule_dict: dict. A dict mapping of all fields of
                PlatformParameterRule object.
            schema_version: int. The schema version for the rule dict.

        Returns:
            PlatformParameterRule. The corresponding PlatformParameterRule
            domain object.
        """
        if (schema_version !=
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION):
            raise Exception(
                'Expected platform parameter rule schema version to be %s, '
                'received %s.' % (
                    feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION,
                    schema_version))

        return cls(
            [
                PlatformParameterFilter.from_dict(filter_dict)
                for filter_dict in rule_dict['filters']],
            rule_dict['value_when_matched'],
        )


class PlatformParameterMetadata(python_utils.OBJECT):
    """Domain object for metadatas of platform parameters."""

    def __init__(self, is_feature, stage):
        self._is_feature = is_feature
        self._stage = stage

    @property
    def is_feature(self):
        """Returns True if the corresponding platform parameter is a feature
        flag.

        Returns:
            bool. True if the corresponding platform parameter is a feature
            flag.
        """
        return self._is_feature

    @property
    def stage(self):
        """Returns the stage of the feature flag.

        Returns:
            str. The stage of the feature flag.
        """
        return self._stage

    def to_dict(self):
        """Returns a dict representation of the PlatformParameterMetadata
        domain object.

        Returns:
            dict. A dict mapping of all fields of PlatformParameterMetadata
            object.
        """
        return {
            'is_feature': self._is_feature,
            'stage': self.stage,
        }

    @classmethod
    def from_dict(cls, metadata_dict):
        """Returns an PlatformParameterMetadata object from a dict.

        Args:
            metadata_dict: dict. A dict mapping of all fields of
                PlatformParameterMetadata object.

        Returns:
            PlatformParameterMetadata. The corresponding
            PlatformParameterMetadata domain object.
        """
        return cls(
            metadata_dict['is_feature'],
            metadata_dict['stage'],
        )


class PlatformParameter(python_utils.OBJECT):
    """Domain object for platform parameters."""

    CMD_CHANGE_VARIABLE_SETTING = 'change_variable_setting'

    DATA_TYPE_PREDICATES_DICT = {
        'bool': lambda x: isinstance(x, bool),
        'string': lambda x: isinstance(x, python_utils.BASESTRING),
        'number': lambda x: isinstance(x, (float, int)),
    }


    PARAMETER_NAME_REGEXP = r'^[A-Za-z0-9_]{1,100}$'

    def __init__(
            self, name, description, data_type, rules,
            rule_schema_version, metadata):
        if re.match(self.PARAMETER_NAME_REGEXP, name) is None:
            raise Exception(
                'Invalid parameter name, expected to match regexp %s, '
                'got %s.' % (
                    self.PARAMETER_NAME_REGEXP, name))

        self._name = name
        self._description = description
        self._data_type = data_type
        self._rules = rules
        self._rule_schema_version = rule_schema_version
        self._metadata = metadata

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
            str. The data type of the platform parameter.
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
    def metadata(self):
        """Returns the metadata of the platform parameter.

        Returns:
            PlatformParameterMetadata. The metadata of the platform parameter.
        """
        return self._metadata

    def validate(self):
        """Validates the PlatformParameter domain object."""
        default_rule = self._rules[-1]
        if len(default_rule.filters) != 0:
            raise utils.ValidationError(
                'The last rule of a variable must not have any filter.')

        if self._data_type not in self.DATA_TYPE_PREDICATES_DICT:
            raise utils.ValidationError(
                'Unsupported data type: %s.' % self._data_type)

        for rule in self._rules:
            predicate = self.DATA_TYPE_PREDICATES_DICT[self.data_type]
            if not predicate(rule.value_when_matched):
                raise utils.ValidationError(
                    'Expected %s, received %s in value_when_matched' % (
                        self._data_type, rule.value_when_matched))
            rule.validate()

        if self._metadata.is_feature:
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
            matched = rule.evaluate(context)
            if matched:
                return rule.value_when_matched

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
            'metadata': self._metadata.to_dict()
        }

    def _validate_feature_flag(self):
        """Validates the PlatformParameter domain object that is a feature
        flag.
        """
        if self._data_type != 'bool':
            raise utils.ValidationError(
                'Data type of feature flags must be bool, got %s '
                'instead.' % self._data_type)
        if self._metadata.stage not in ALLOWED_FEATURE_STAGES:
            raise utils.ValidationError(
                'Invalid feature stage, expected on of %s, got %s.' % (
                    ALLOWED_FEATURE_STAGES, self._data_type))
        enabling_rules = [
            rule for rule in self._rules if rule.value_when_matched]
        for rule in enabling_rules:
            if not rule.has_server_mode_filter():
                raise utils.ValidationError(
                    'Rules that enable a feature must have a server_mode '
                    'filter.')
            mode_filters = [
                mode_filter for mode_filter in rule.filters
                if mode_filter.type == 'server_mode']
            for mode_filter in mode_filters:
                value_list = (
                    mode_filter.value if isinstance(mode_filter.value, list)
                    else [mode_filter.value])
                if self._metadata.stage == FEATURE_STAGES.dev:
                    if (
                            SERVER_MODES.test in value_list or
                            SERVER_MODES.prod in value_list):
                        raise utils.ValidationError(
                            'Feature in dev stage cannot be enabled in test or'
                            ' production environment.')
                elif self._metadata.stage == FEATURE_STAGES.test:
                    if SERVER_MODES.prod in value_list:
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
        return cls(
            param_dict['name'],
            param_dict['description'],
            param_dict['data_type'],
            [
                PlatformParameterRule.from_dict(
                    rule_dict, param_dict['rule_schema_version'])
                for rule_dict in param_dict['rules']],
            param_dict['rule_schema_version'],
            PlatformParameterMetadata.from_dict(param_dict.get('metadata', {}))
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


class Registry(python_utils.OBJECT):
    """Registry of all platform parameters."""

    # The keys of parameter_registry are the property names, and the values
    # are PlatformParameter instances with initial settings defined in this
    # file.
    parameter_registry = {}

    @classmethod
    def create_platform_parameter(
            cls, name, description, data_type, is_feature=False,
            feature_stage=None):
        """Creates, registers and returns a platform parameter.

        Args:
            name: str. The name of the platform parameter.
            description: str. The description of the platform parameter.
            data_type: str. The data type of the platform parameter, must be
                one of the following: 'bool', 'number', 'string'.
            is_feature: bool. True if the platform parameter is a feature flag.
            feature_stage: str|None. The stage of the feature, required if
                'is_feature' is True.

        Returns:
            PlatformParameter. The created platform parameter.
        """
        default = None
        if data_type == 'bool':
            default = False
        elif data_type == 'number':
            default = 0
        elif data_type == 'string':
            default = ''
        else:
            raise Exception('Unsupported data type %s.' % data_type)

        parameter_dict = {
            'name': name,
            'description': description,
            'data_type': data_type,
            'rules': [
                {
                    'filters': [],
                    'value_when_matched': default,
                }
            ],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'metadata': {
                'is_feature': is_feature,
                'stage': feature_stage,
            },
        }
        parameter = cls.create_platform_parameter_from_dict(parameter_dict)
        return parameter

    @classmethod
    def create_feature_flag(
            cls, name, description, stage):
        """Creates, registers and returns a platform parameter that is also a
        feature flag.

        Args:
            name: str. The name of the platform parameter.
            description: str. The description of the platform parameter.
            stage: str. The stage of the feature.

        Returns:
            PlatformParameter. The created feature flag.
        """
        feature = cls.create_platform_parameter(
            name, description, 'bool', is_feature=True, feature_stage=stage)
        return feature

    @classmethod
    def init_platform_parameter(cls, name, instance):
        """Initializes parameter_registry with keys as the parameter names and
        values as instances of the specified parameter.

        Args:
            name: str. The name of the platform parameter.
            instance: PlatformParameter. The instance of the platform parameter.
        """
        if cls.parameter_registry.get(name):
            raise Exception('Parameter with name %s already exists.' % name)
        cls.parameter_registry[name] = instance

    @classmethod
    def get_platform_parameter(cls, name):
        """Returns the instance of the specified name of the platform
        parameter.

        Args:
            name: str. The name of the platform parameter.

        Returns:
            PlatformParameter. The instance of the specified platform
            parameter.
        """
        parameter_from_cache = cls.load_platform_parameter_from_memcache(
            name)
        if parameter_from_cache is not None:
            return parameter_from_cache

        parameter = None

        parameter_from_storage = cls.load_platform_parameter_from_storage(
            name)
        if parameter_from_storage is not None:
            parameter = parameter_from_storage
        elif name in cls.parameter_registry:
            parameter = cls.parameter_registry[name]
        else:
            raise Exception('Platform parameter not found: %s.' % name)

        memcache_key = PlatformParameter.get_memcache_key(name)
        memcache_services.set_multi({
            memcache_key: parameter,
        })
        return parameter

    @classmethod
    def update_platform_parameter(
            cls, name, committer_id, commit_message, new_rule_dicts):
        """Updates the platform parameter with new rules.

        Args:
            name: str. The name of the platform parameter to update.
            committer_id: str. ID of the committer.
            commit_message: str. The commit message.
            new_rule_dicts: list(dist). A list of dict mappings of all fields
                of PlatformParameterRule object.
        """
        param = cls.get_platform_parameter(name)

        # Create a temporary param instance with new rules for validation,
        # if the new rules are invalid, an exception will be raised in
        # validate() method.
        param_dict = param.to_dict()
        param_dict['rules'] = new_rule_dicts
        updated_param = param.from_dict(param_dict)
        updated_param.validate()

        # Set value in datastore.
        model_instance = config_models.PlatformParameterModel.get(
            param.name, strict=False)
        if model_instance is None:
            model_instance = config_models.PlatformParameterModel.create(
                param.name,
                [rule.to_dict() for rule in param.rules],
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION
            )

        new_rules = [
            PlatformParameterRule.from_dict(
                rule_dict, param.rule_schema_version)
            for rule_dict in new_rule_dicts]
        param.set_rules(new_rules)

        model_instance.rules = [rule.to_dict() for rule in param.rules]
        model_instance.commit(
            committer_id,
            commit_message,
            [{
                'cmd': PlatformParameterChange.CMD_EDIT_RULES,
                'new_rules': new_rule_dicts
            }]
        )

        memcache_services.delete(PlatformParameter.get_memcache_key(name))

    @classmethod
    def get_all_platform_parameter_names(cls):
        """Return a list of all the platform parameter names.

        Returns:
            list(str). The list of all platform parameter names.
        """
        return list(cls.parameter_registry)

    @classmethod
    def evaluate_all_platform_parameters(cls, context):
        """Evaluate all platform parameters with the given context.

        Args:
            context: EvaluationContext. The context for evaluation.

        Returns:
            dict. The keys are the platform parameter names and the values are
            results of evaluation of the corresponding parameters.
        """
        result_dict = {}
        for parameter_name in cls.get_all_platform_parameter_names():
            parameter = cls.get_platform_parameter(parameter_name)
            result_dict[parameter_name] = parameter.evaluate(context)
        return result_dict

    @classmethod
    def create_platform_parameter_from_dict(cls, parameter_dict):
        """Creates, registers and returns a platform parameter using the given
        dict representation of a platform parameter.

        Args:
            parameter_dict: dict. A dict mapping of all fields of
                PlatformParameter object.

        Returns:
            PlatformParameter. The created platform parameter.
        """
        parameter = PlatformParameter.from_dict(parameter_dict)

        cls.init_platform_parameter(parameter.name, parameter)

        return parameter

    @classmethod
    def load_platform_parameter_from_storage(cls, name):
        """Loads platform parameter from storage.

        Args:
            name: str. The name of the platform parameter.

        Returns:
            PlatformParameter|None. The loaded instance, None if it's not found
            in storage.
        """
        parameter_model = config_models.PlatformParameterModel.get(
            name, strict=False)

        if parameter_model:
            parameter_with_init_settings = cls.parameter_registry.get(name)
            return PlatformParameter.from_dict({
                'name': parameter_with_init_settings.name,
                'description': parameter_with_init_settings.description,
                'data_type': parameter_with_init_settings.data_type,
                'rules': parameter_model.rules,
                'rule_schema_version': parameter_model.rule_schema_version,
                'metadata': parameter_with_init_settings.metadata.to_dict(),
            })
        else:
            return None

    @classmethod
    def load_platform_parameter_from_memcache(cls, name):
        """Loads cached platform parameter from memcache.

        Args:
            name: str. The name of the platform parameter.

        Returns:
            PlatformParameter|None. The loaded instance, None if it's not found
            in cache.
        """
        memcache_key = PlatformParameter.get_memcache_key(name)
        cached_parameter = memcache_services.get_multi([memcache_key]).get(
            memcache_key)
        return cached_parameter


# Platform parameters should all be defined below.

# This is a dummy feature flag demostrating the definition of features,
# it can be safely removed once more realistic features are added here.
Registry.create_feature_flag(
    'Dummy_Feature',
    'This is a dummy feature flag',
    FEATURE_STAGES.dev,
)
