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

"""Registry for platform parameters."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import core.domain.platform_parameter_domain as param_domain
from core.platform import models
import feconf
import python_utils
import utils


(config_models,) = models.Registry.import_models(
    [models.NAMES.config])
memcache_services = models.Registry.import_memcache_services()


class Registry(python_utils.OBJECT):
    """Registry of all platform parameters."""

    DEFAULT_VALUE_BY_TYPE_DICT = {
        'bool': False,
        'number': 0,
        'string': '',
    }

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
            feature_stage: FEATURE_STAGES|None. The stage of the feature,
                required if 'is_feature' is True.

        Returns:
            PlatformParameter. The created platform parameter.
        """
        if data_type in cls.DEFAULT_VALUE_BY_TYPE_DICT:
            default = cls.DEFAULT_VALUE_BY_TYPE_DICT[data_type]
        else:
            raise Exception(
                'Unsupported data type \'%s\', must be one of'' %s.' % (
                    data_type, list(cls.DEFAULT_VALUE_BY_TYPE_DICT.keys())))

        param_dict = {
            'name': name,
            'description': description,
            'data_type': data_type,
            'rules': [],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'default_value': default,
            'metadata': {
                'is_feature': is_feature,
                'feature_stage': feature_stage,
            },
        }
        return cls.create_platform_parameter_from_dict(param_dict)

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
        return cls.create_platform_parameter(
            name, description, 'bool', is_feature=True, feature_stage=stage)

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

        memcache_key = param_domain.PlatformParameter.get_memcache_key(name)
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
            param_domain.PlatformParameterRule.from_dict(
                rule_dict, param.rule_schema_version)
            for rule_dict in new_rule_dicts]
        param.set_rules(new_rules)

        model_instance.rules = [rule.to_dict() for rule in param.rules]
        model_instance.commit(
            committer_id,
            commit_message,
            [{
                'cmd': param_domain.PlatformParameterChange.CMD_EDIT_RULES,
                'new_rules': new_rule_dicts
            }]
        )

        memcache_services.delete(
            param_domain.PlatformParameter.get_memcache_key(name))

    @classmethod
    def get_all_platform_parameter_names(cls):
        """Return a list of all the platform parameter names.

        Returns:
            list(str). The list of all platform parameter names.
        """
        return list(cls.parameter_registry.keys())

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
        parameter = param_domain.PlatformParameter.from_dict(parameter_dict)

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
            param_with_init_settings = cls.parameter_registry.get(name)
            return param_domain.PlatformParameter.from_dict({
                'name': param_with_init_settings.name,
                'description': param_with_init_settings.description,
                'data_type': param_with_init_settings.data_type,
                'rules': parameter_model.rules,
                'rule_schema_version': parameter_model.rule_schema_version,
                'default_value': param_with_init_settings.default_value,
                'metadata': param_with_init_settings.metadata.to_dict(),
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
        memcache_key = param_domain.PlatformParameter.get_memcache_key(name)
        cached_parameter = memcache_services.get_multi([memcache_key]).get(
            memcache_key)
        return cached_parameter


PARAM_NAMES = utils.create_enum('dummy_feature') # pylint: disable=invalid-name

# Platform parameters should all be defined below.

Registry.create_feature_flag(
    PARAM_NAMES.dummy_feature,
    'This is a dummy feature flag.',
    param_domain.FEATURE_STAGES.dev,
)
