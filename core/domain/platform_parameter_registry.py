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

from __future__ import annotations

from core import feconf
from core.domain import (
    caching_services,
    platform_parameter_domain,
    platform_parameter_list,
)
from core.platform import models

from typing import Dict, List, Optional, Union

MYPY = False
if MYPY:  # pragma: no cover
    from mypy_imports import config_models

(config_models,) = models.Registry.import_models(
    [models.Names.CONFIG]
)

ParamName = platform_parameter_list.ParamName
PLATFORM_PARAMETER_NAME_TO_DESCRIPTION_DATA_TYPE_AND_DEFAULT = (
    platform_parameter_list
    .PLATFORM_PARAMETER_NAME_TO_DESCRIPTION_DATA_TYPE_AND_DEFAULT
)


class Registry:
    """Registry of all platform parameters."""

    DEFAULT_VALUE_BY_TYPE_DICT: Dict[
        platform_parameter_domain.DataTypes, Union[bool, str, int, float]
    ] = {
        platform_parameter_domain.DataTypes.BOOL: False,
        platform_parameter_domain.DataTypes.NUMBER: 0,
        platform_parameter_domain.DataTypes.STRING: '',
    }

    @classmethod
    def create_platform_parameter(
        cls,
        name: ParamName,
        description: str,
        data_type: platform_parameter_domain.DataTypes,
        default: Optional[Union[bool, int, str, float]] = None,
    ) -> platform_parameter_domain.PlatformParameter:
        """Creates, registers and returns a platform parameter.

        Args:
            name: Enum(PARAMS). The name of the platform parameter.
            description: str. The description of the platform parameter.
            data_type: Enum(DataTypes). The data type of the platform
                parameter, must be one of the following: bool, number, string.
            default: Optional[Union[bool, int, str, float]]. The default value
                for the platform parameter.

        Returns:
            PlatformParameter. The created platform parameter.

        Raises:
            Exception. The data type is not supported.
        """
        if data_type in cls.DEFAULT_VALUE_BY_TYPE_DICT:
            if not default:
                default = cls.DEFAULT_VALUE_BY_TYPE_DICT[data_type]
        else:
            allowed_data_types = [
                data_type_enum.value
                for data_type_enum in cls.DEFAULT_VALUE_BY_TYPE_DICT
            ]
            raise Exception(
                'Unsupported data type \'%s\', must be one of %s.' % (
                    data_type.value, allowed_data_types
                )
            )

        param_dict: platform_parameter_domain.PlatformParameterDict = {
            'name': name.value,
            'description': description,
            'data_type': data_type.value,
            'rules': [],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION
            ),
            'default_value': default,
        }
        return cls.init_platform_parameter_from_dict(param_dict)

    @classmethod
    def get_platform_parameter(
        cls, name: str
    ) -> platform_parameter_domain.PlatformParameter:
        """Returns the instance of the specified name of the platform
        parameter.

        Args:
            name: str. The name of the platform parameter.

        Returns:
            PlatformParameter. The instance of the specified platform
            parameter.

        Raises:
            Exception. The given name of the platform parameter doesn't exist.
        """
        parameter_from_cache = cls.load_platform_parameter_from_memcache(name)
        if parameter_from_cache is not None:
            return parameter_from_cache

        param_spec = (
            PLATFORM_PARAMETER_NAME_TO_DESCRIPTION_DATA_TYPE_AND_DEFAULT.get(
                name
            )
        )
        if param_spec is None:
            raise Exception('Platform parameter not found: %s.' % name)

        parameter_from_storage = cls.load_platform_parameter_from_storage(name)
        if parameter_from_storage is not None:
            parameter = parameter_from_storage
        else:
            parameter = platform_parameter_domain.PlatformParameter.from_dict(
                {
                    'name': name,
                    'description': param_spec[0],
                    'data_type': param_spec[1].value,
                    'rules': [],
                    'rule_schema_version': (
                        feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION
                    ),
                    'default_value': param_spec[2],
                }
            )

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_PLATFORM_PARAMETER,
            None,
            {
                name: parameter,
            },
        )
        return parameter

    @classmethod
    def update_platform_parameter(
        cls,
        name: str,
        committer_id: str,
        commit_message: str,
        new_rules: List[platform_parameter_domain.PlatformParameterRule],
        default_value: platform_parameter_domain.PlatformDataTypes,
    ) -> None:
        """Updates the platform parameter with new rules.

        Args:
            name: str. The name of the platform parameter to update.
            committer_id: str. ID of the committer.
            commit_message: str. The commit message.
            new_rules: list(PlatformParameterRule). A list of
                PlatformParameterRule objects.
            default_value: PlatformDataTypes. The new default value of
                platform parameter.
        """
        param = cls.get_platform_parameter(name)

        # Create a temporary param instance with new rules for validation,
        # if the new rules are invalid, an exception will be raised in
        # validate() method.
        new_rule_dicts = [rules.to_dict() for rules in new_rules]
        param_dict = param.to_dict()
        param_dict['rules'] = new_rule_dicts
        param_dict['default_value'] = default_value
        updated_param = param.from_dict(param_dict)
        updated_param.validate()

        model_instance = cls._to_platform_parameter_model(param)
        param.set_rules(new_rules)
        param.set_default_value(default_value)

        model_instance.rules = [rule.to_dict() for rule in param.rules]
        model_instance.default_value = default_value
        model_instance.commit(
            committer_id,
            commit_message,
            [
                {
                    'cmd': (
                        platform_parameter_domain.PlatformParameterChange.CMD_EDIT_RULES
                    ),
                    'new_rules': new_rule_dicts,
                    'default_value': default_value,
                }
            ],
        )

        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_PLATFORM_PARAMETER, None, [name]
        )

    @classmethod
    def get_all_platform_parameter_names(cls) -> List[str]:
        """Return a list of all the platform parameter names.

        Returns:
            list(str). The list of all platform parameter names.
        """
        return list(
            PLATFORM_PARAMETER_NAME_TO_DESCRIPTION_DATA_TYPE_AND_DEFAULT.keys()
        )

    @classmethod
    def evaluate_all_platform_parameters(
        cls, context: platform_parameter_domain.EvaluationContext
    ) -> Dict[str, Union[str, bool, int, float]]:
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
    def init_platform_parameter_from_dict(
        cls, parameter_dict: platform_parameter_domain.PlatformParameterDict
    ) -> platform_parameter_domain.PlatformParameter:
        """Creates and returns a platform parameter using the given
        dict representation of a platform parameter.

        Args:
            parameter_dict: dict. A dict mapping of all fields of
                PlatformParameter object.

        Returns:
            PlatformParameter. The created platform parameter.
        """
        return platform_parameter_domain.PlatformParameter.from_dict(
            parameter_dict
        )

    @classmethod
    def load_platform_parameter_from_storage(
        cls, name: str
    ) -> Optional[platform_parameter_domain.PlatformParameter]:
        """Loads platform parameter from storage.

        Args:
            name: str. The name of the platform parameter.

        Returns:
            PlatformParameter|None. The loaded instance, None if it's not found
            in storage.
        """
        parameter_model = config_models.PlatformParameterModel.get(
            name, strict=False
        )

        if parameter_model:
            param_spec = (
                PLATFORM_PARAMETER_NAME_TO_DESCRIPTION_DATA_TYPE_AND_DEFAULT
                .get(name)
            )
            if param_spec is None:
                raise Exception('Platform parameter not found: %s.' % name)

            if parameter_model.default_value is None:
                default_value = param_spec[2]
            else:
                default_value = parameter_model.default_value
            return platform_parameter_domain.PlatformParameter.from_dict(
                {
                    'name': name,
                    'description': param_spec[0],
                    'data_type': param_spec[1].value,
                    'rules': parameter_model.rules,
                    'rule_schema_version': parameter_model.rule_schema_version,
                    'default_value': default_value,
                }
            )
        else:
            return None

    @classmethod
    def load_platform_parameter_from_memcache(
        cls, name: str
    ) -> Optional[platform_parameter_domain.PlatformParameter]:
        """Loads cached platform parameter from memcache.

        Args:
            name: str. The name of the platform parameter.

        Returns:
            PlatformParameter|None. The loaded instance, None if it's not found
            in cache.
        """
        cached_parameter = caching_services.get_multi(
            caching_services.CACHE_NAMESPACE_PLATFORM_PARAMETER, None, [name]
        ).get(name)
        return cached_parameter

    @classmethod
    def _to_platform_parameter_model(
        cls, param: platform_parameter_domain.PlatformParameter
    ) -> config_models.PlatformParameterModel:
        """Returns the platform parameter model corresponding to the given
        domain object.

        Args:
            param: PlatformParameter. The platform parameter domain object.

        Returns:
            PlatformParameterModel. The corresponding storage model.
        """
        model_instance = config_models.PlatformParameterModel.get(
            param.name, strict=False
        )
        if model_instance is None:
            model_instance = config_models.PlatformParameterModel.create(
                param.name,
                [rule.to_dict() for rule in param.rules],
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION,
                default_value=param.default_value,
            )
        return model_instance
