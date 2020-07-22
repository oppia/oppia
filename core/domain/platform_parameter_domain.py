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

from core.domain import change_domain
from core.platform import models
import python_utils
import utils


(config_models,) = models.Registry.import_models(
    [models.NAMES.config])
memcache_services = models.Registry.import_memcache_services()


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
            self, client_platform, client_type, browser_type,
            app_version, user_locale, mode):
        self._client_platform = client_platform
        self._client_type = client_type
        self._browser_type = browser_type
        self._app_version = app_version
        self._user_locale = user_locale
        self._mode = mode

    @property
    def client_platform(self):
        """Returns client platform.

        Returns:
            str. The client platform.
        """
        return self._client_platform

    @property
    def client_type(self):
        """Returns client type.

        Returns:
            str. The client type.
        """
        return self._client_type

    @property
    def browser_type(self):
        """Returns client browser type.

        Returns:
            str. The client browser type.
        """
        return self._browser_type

    @property
    def app_version(self):
        """Returns client application version.

        Returns:
            str. The client application version.
        """
        return self._app_version

    @property
    def user_locale(self):
        """Returns client locale.

        Returns:
            str. The client locale.
        """
        return self._user_locale

    @property
    def mode(self):
        """Returns the mode Oppia is running on.

        Returns:
            str. The the mode Oppia is running on.
        """
        return self._mode

    @classmethod
    def create_from_dict(cls, client_context_dict, server_context_dict):
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
            client_platform=client_context_dict.get('client_platform'),
            client_type=client_context_dict.get('client_type'),
            browser_type=client_context_dict.get('browser_type'),
            app_version=client_context_dict.get('app_version'),
            user_locale=client_context_dict.get('user_locale'),
            mode=server_context_dict.get('mode'),
        )


class PlatformParameterFilter(python_utils.OBJECT):
    """Domain object for filters in platform parameters."""

    SUPPORTED_FILTER_TYPE = [
        'mode', 'user_locale', 'client_platform', 'client_type',
        'browser_type', 'app_version',
    ]
    VERSION_EXPR_REGEXP = re.compile(r'^(>|<|=|>=|<=)?(\d+(?:\.\d+)*)$')

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
        if self._type == 'mode':
            matched = context.mode == value
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
                    expr=value,
                    client_version=context.app_version,
                )
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
        if self._type == 'app_version':
            if isinstance(self._value, list):
                values = self._value
            else:
                values = [self._value]
            for version_expr in values:
                if not self.VERSION_EXPR_REGEXP.match(version_expr):
                    raise utils.ValidationError(
                        'Invalid version expression %s.' % version_expr)

    @classmethod
    def create_from_dict(cls, filter_dict):
        """Returns an PlatformParameterFilter object from a dict.

        Args:
            filter_dict: dict. A dict mapping of all fields of
                PlatformParameterFilter object.

        Returns:
            PlatformParameterFilter. The corresponding PlatformParameterFilter
            domain object.
        """
        return cls(
            filter_type=filter_dict['type'],
            filter_value=filter_dict['value'],
        )

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
            if op is None:
                op = '='

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
            list(PlatformParameterFilter). the filters of the rule.
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
            tuple. A 2-tuple whose elements are as follows:
            - bool. True if the rule is matched.
            - *. The outcome if this rule when it's matched, None if not
            matched.
        """
        are_all_filters_matched = (
            all(
                filter_domain.evaluate(context)
                for filter_domain in self._filters))
        if are_all_filters_matched:
            return (True, self._value_when_matched)
        return (False, None)

    def has_mode_filter(self):
        """Checks if the rule has a filter with type 'mode'.

        Returns:
            bool. True if the rule has a filter with type 'mode'.
        """
        return (
            any(
                filter_domain.type == 'mode'
                for filter_domain in self._filters))

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
    def create_from_dict(cls, rule_dict):
        """Returns an PlatformParameterRule object from a dict.

        Args:
            rule_dict: dict. A dict mapping of all fields of
                PlatformParameterRule object.

        Returns:
            PlatformParameterRule. The corresponding PlatformParameterRule
            domain object.
        """
        return cls(
            filters=[
                PlatformParameterFilter.create_from_dict(filter_dict)
                for filter_dict in rule_dict['filters']],
            value_when_matched=rule_dict['value_when_matched'],
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
            str. the stage of the feature flag.
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
    def create_from_dict(cls, metadata_dict):
        """Returns an PlatformParameterMetadata object from a dict.

        Args:
            metadata_dict: dict. A dict mapping of all fields of
                PlatformParameterMetadata object.

        Returns:
            PlatformParameterMetadata. The corresponding
            PlatformParameterMetadata domain object.
        """
        return cls(
            is_feature=metadata_dict.get('is_feature', False),
            stage=metadata_dict.get('stage', None),
        )


class PlatformParameter(python_utils.OBJECT):
    """Domain object for platform parameters."""

    CMD_CHANGE_VARIABLE_SETTING = 'change_variable_setting'

    DATA_TYPE_PREDICATES_DICT = {
        'bool': lambda x: isinstance(x, bool),
        'string': lambda x: isinstance(x, python_utils.BASESTRING),
        'number': lambda x: isinstance(x, (float, int)),
    }

    ALLOWED_FEATURE_STAGE = ['dev', 'test', 'prod']

    def __init__(self, name, description, data_type, rules, metadata):
        self._name = name
        self._description = description
        self._data_type = data_type
        self._rules = rules
        self._metadata = metadata

    @property
    def name(self):
        """Returns the name of the platform parameter.

        Returns:
            str. the name of the platform parameter.
        """
        return self._name

    @property
    def description(self):
        """Returns the description of the platform parameter.

        Returns:
            str. the description of the platform parameter.
        """
        return self._description

    @property
    def data_type(self):
        """Returns the data type of the platform parameter.

        Returns:
            str. the data type of the platform parameter.
        """
        return self._data_type

    @property
    def rules(self):
        """Returns the rules of the platform parameter.

        Returns:
            list(PlatformParameterRules). the rules of the platform parameter.
        """
        return self._rules

    @property
    def metadata(self):
        """Returns the metadata of the platform parameter.

        Returns:
            PlatformParameterMetadata. the metadata of the platform parameter.
        """
        return self._metadata

    def update(self, committer_id, commit_message, new_rule_dicts):
        """Updates the rules of the platform parameter instance.

        Args:
            committer_id: str. ID of the committer.
            commit_message: str. The commit message.
            new_rule_dicts: list(dist). A list of dict mappings of all fields
                of PlatformParameterRule object, used for creating
                PlatformParameterRule instances.

        Returns:
            PlatformParameter. the instance with updated rules.
        """
        # Set value in datastore.
        model_instance = config_models.PlatformParameterModel.get(
            self._name, strict=False)
        if model_instance is None:
            model_instance = config_models.PlatformParameterModel.create(
                param_name=self._name,
                rule_dicts=[rule.to_dict() for rule in self._rules],
            )

        updated_para = self.create_from_dict({
            'name': self._name,
            'description': self._description,
            'data_type': self._data_type,
            'rules': new_rule_dicts,
            'metadata': self._metadata.to_dict(),
        })
        updated_para.validate()

        self._rules = [
            PlatformParameterRule.create_from_dict(rule_dict)
            for rule_dict in new_rule_dicts]
        model_instance.rules = [rule.to_dict() for rule in self._rules]

        model_instance.commit(
            committer_id,
            commit_message,
            [{
                'cmd': PlatformParameterChange.CMD_REPLACE_PARAMETER_RULES,
                'new_rules': new_rule_dicts
            }]
        )

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
            matched, value = rule.evaluate(context)
            if matched:
                return value

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
        if self._metadata.stage not in self.ALLOWED_FEATURE_STAGE:
            raise utils.ValidationError(
                'Invalid feature stage, expected on of %s, got %s.' % (
                    self.ALLOWED_FEATURE_STAGE, self._data_type))
        enabling_rules = [
            rule for rule in self._rules if rule.value_when_matched]
        for rule in enabling_rules:
            if not rule.has_mode_filter():
                raise utils.ValidationError(
                    'Rules that enable a feature must have a mode '
                    'filter.')
            mode_filters = [
                mode_filter for mode_filter in rule.filters
                if mode_filter.type == 'mode']
            for mode_filter in mode_filters:
                value_list = (
                    mode_filter.value if isinstance(mode_filter.value, list)
                    else [mode_filter.value])
                if self._metadata.stage == 'dev':
                    if 'test' in value_list or 'prod' in value_list:
                        raise utils.ValidationError(
                            'Feature in dev stage cannot be enabled in test or'
                            ' production environment.')
                elif self._metadata.stage == 'test':
                    if 'prod' in value_list:
                        raise utils.ValidationError(
                            'Feature in test stage cannot be enabled in '
                            'production environment.')

    @classmethod
    def create_from_dict(cls, para_dict):
        """Returns an PlatformParameter object from a dict.

        Args:
            para_dict: dict. A dict mapping of all fields of
                PlatformParameter object.

        Returns:
            PlatformParameter. The corresponding PlatformParameter domain
            object.
        """
        return cls(
            name=para_dict['name'],
            description=para_dict['description'],
            data_type=para_dict['data_type'],
            rules=[
                PlatformParameterRule.create_from_dict(rule_dict)
                for rule_dict in para_dict['rules']],
            metadata=PlatformParameterMetadata.create_from_dict(
                para_dict.get('metadata', {})),
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
        if is_feature and feature_stage is None:
            raise Exception(
                'feature_stage must be specified when is_feature '
                'is set to True.')

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
            'metadata': {
                'is_feature': is_feature,
                'stage': feature_stage,
            }
        }
        parameter = cls.create_platform_parameter_from_dict(parameter_dict)
        return parameter

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
        """Updates the platform parameter.

        Args:
            name: str. The name of the platform parameter to update.
            committer_id: str. ID of the committer.
            commit_message: str. The commit message.
            new_rule_dicts: list(dist). A list of dict mappings of all fields
                of PlatformParameterRule object.
        """
        parameter = cls.get_platform_parameter(name)
        parameter.update(committer_id, commit_message, new_rule_dicts)

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
        parameter = PlatformParameter.create_from_dict(parameter_dict)

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
            return PlatformParameter.create_from_dict({
                'name': parameter_with_init_settings.name,
                'description': parameter_with_init_settings.description,
                'data_type': parameter_with_init_settings.data_type,
                'rules': parameter_model.rules,
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
