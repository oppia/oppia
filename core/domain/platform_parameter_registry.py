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

import enum

from core import feconf
from core.domain import caching_services
from core.domain import platform_parameter_domain
from core.domain import platform_parameter_list
from core.platform import models

from typing import Dict, List, Optional, Union

MYPY = False
if MYPY: # pragma: no cover
    from mypy_imports import config_models
    from mypy_imports import suggestion_models

(config_models, suggestion_models) = models.Registry.import_models(
    [models.Names.CONFIG, models.Names.SUGGESTION])

ParamNames = platform_parameter_list.ParamNames


class Registry:
    """Registry of all platform parameters."""

    DEFAULT_VALUE_BY_TYPE_DICT: Dict[
        platform_parameter_domain.DataTypes,
        Union[bool, str, int, float]
    ] = {
        platform_parameter_domain.DataTypes.BOOL: False,
        platform_parameter_domain.DataTypes.NUMBER: 0,
        platform_parameter_domain.DataTypes.STRING: '',
    }

    # The keys of parameter_registry are the property names, and the values
    # are PlatformParameter instances with initial settings defined in this
    # file.
    parameter_registry: Dict[
        str, platform_parameter_domain.PlatformParameter
    ] = {}

    @classmethod
    def create_platform_parameter(
        cls,
        name: enum.Enum,
        description: str,
        data_type: platform_parameter_domain.DataTypes,
        default: Optional[Union[bool, int, str, float]] = None,
        is_feature: bool = False,
        feature_stage: Optional[platform_parameter_domain.FeatureStages] = None
    ) -> platform_parameter_domain.PlatformParameter:
        """Creates, registers and returns a platform parameter.

        Args:
            name: Enum(PARAMS). The name of the platform parameter.
            description: str. The description of the platform parameter.
            data_type: Enum(DataTypes). The data type of the platform
                parameter, must be one of the following: bool, number, string.
            default: Optional[Union[bool, int, str, float]]. The default value
                for the platform parameter.
            is_feature: bool. True if the platform parameter is a feature flag.
            feature_stage: Enum(FeatureStages)|None. For feature flags
                (i.e., where 'is_feature' is True), this specifies the feature
                stage for that feature. For platform parameters, this value
                should be None.

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
                'Unsupported data type \'%s\', must be one of'' %s.' % (
                    data_type.value, allowed_data_types))

        param_dict: platform_parameter_domain.PlatformParameterDict = {
            'name': name.value,
            'description': description,
            'data_type': data_type.value,
            'rules': [],
            'rule_schema_version': (
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION),
            'default_value': default,
            'is_feature': is_feature,
            'feature_stage': feature_stage.value if feature_stage else None,
        }
        return cls.init_platform_parameter_from_dict(param_dict)

    @classmethod
    def create_feature_flag(
        cls,
        name: enum.Enum,
        description: str,
        stage: platform_parameter_domain.FeatureStages
    ) -> platform_parameter_domain.PlatformParameter:
        """Creates, registers and returns a platform parameter that is also a
        feature flag.

        Args:
            name: Enum(PARAMS). The name of the platform parameter.
            description: str. The description of the platform parameter.
            stage: Enum(FeatureStages). The stage of the feature.

        Returns:
            PlatformParameter. The created feature flag.
        """
        return cls.create_platform_parameter(
            name, description, platform_parameter_domain.DataTypes.BOOL,
            is_feature=True, feature_stage=stage)

    @classmethod
    def init_platform_parameter(
        cls,
        name: str,
        instance: platform_parameter_domain.PlatformParameter
    ) -> None:
        """Initializes parameter_registry with keys as the parameter names and
        values as instances of the specified parameter.

        Args:
            name: str. The name of the platform parameter.
            instance: PlatformParameter. The instance of the platform parameter.

        Raises:
            Exception. The given name of the platform parameter already exists.
        """
        if cls.parameter_registry.get(name):
            raise Exception('Parameter with name %s already exists.' % name)
        cls.parameter_registry[name] = instance

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
        parameter_from_cache = cls.load_platform_parameter_from_memcache(
            name)
        if parameter_from_cache is not None:
            return parameter_from_cache

        parameter_from_storage = cls.load_platform_parameter_from_storage(name)
        if parameter_from_storage is not None:
            parameter = parameter_from_storage
        elif name in cls.parameter_registry:
            parameter = cls.parameter_registry[name]
        else:
            raise Exception('Platform parameter not found: %s.' % name)

        caching_services.set_multi(
            caching_services.CACHE_NAMESPACE_PLATFORM_PARAMETER, None,
            {
                name: parameter,
            })
        return parameter

    @classmethod
    def update_platform_parameter(
        cls,
        name: str,
        committer_id: str,
        commit_message: str,
        new_rules: List[platform_parameter_domain.PlatformParameterRule],
        default_value: platform_parameter_domain.PlatformDataTypes
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
        cls.parameter_registry[param.name] = param

        model_instance.rules = [rule.to_dict() for rule in param.rules]
        model_instance.default_value = default_value
        model_instance.commit(
            committer_id,
            commit_message,
            [{
                'cmd': (
                    platform_parameter_domain
                    .PlatformParameterChange.CMD_EDIT_RULES),
                'new_rules': new_rule_dicts,
                'default_value': default_value
            }]
        )

        caching_services.delete_multi(
            caching_services.CACHE_NAMESPACE_PLATFORM_PARAMETER, None, [name])

    @classmethod
    def get_all_platform_parameter_names(cls) -> List[str]:
        """Return a list of all the platform parameter names.

        Returns:
            list(str). The list of all platform parameter names.
        """
        return list(cls.parameter_registry.keys())

    @classmethod
    def evaluate_all_platform_parameters(
        cls,
        context: platform_parameter_domain.EvaluationContext
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
        cls,
        parameter_dict: platform_parameter_domain.PlatformParameterDict
    ) -> platform_parameter_domain.PlatformParameter:
        """Creates, registers and returns a platform parameter using the given
        dict representation of a platform parameter.

        Args:
            parameter_dict: dict. A dict mapping of all fields of
                PlatformParameter object.

        Returns:
            PlatformParameter. The created platform parameter.
        """
        parameter = platform_parameter_domain.PlatformParameter.from_dict(
            parameter_dict)

        cls.init_platform_parameter(parameter.name, parameter)

        return parameter

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
            name, strict=False)

        if parameter_model:
            param_with_init_settings = cls.parameter_registry[name]
            if parameter_model.default_value is None:
                default_value = param_with_init_settings.default_value
            else:
                default_value = parameter_model.default_value
            return platform_parameter_domain.PlatformParameter.from_dict({
                'name': param_with_init_settings.name,
                'description': param_with_init_settings.description,
                'data_type': param_with_init_settings.data_type,
                'rules': parameter_model.rules,
                'rule_schema_version': parameter_model.rule_schema_version,
                'default_value': default_value,
                'is_feature': param_with_init_settings.is_feature,
                'feature_stage': param_with_init_settings.feature_stage,
            })
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
        cls,
        param: platform_parameter_domain.PlatformParameter
    ) -> config_models.PlatformParameterModel:
        """Returns the platform parameter model corresponding to the given
        domain object.

        Args:
            param: PlatformParameter. The platform parameter domain object.

        Returns:
            PlatformParameterModel. The corresponding storage model.
        """
        model_instance = config_models.PlatformParameterModel.get(
            param.name, strict=False)
        if model_instance is None:
            model_instance = config_models.PlatformParameterModel.create(
                param.name,
                [rule.to_dict() for rule in param.rules],
                feconf.CURRENT_PLATFORM_PARAMETER_RULE_SCHEMA_VERSION,
                default_value=param.default_value
            )
        return model_instance


# Platform parameters should all be defined below.
Registry.create_feature_flag(
    ParamNames.DUMMY_FEATURE_FLAG_FOR_E2E_TESTS,
    'This is a dummy feature flag for the e2e tests.',
    platform_parameter_domain.FeatureStages.PROD,
)

Registry.create_platform_parameter(
    ParamNames.DUMMY_PARAMETER,
    'This is a dummy platform parameter.',
    platform_parameter_domain.DataTypes.STRING
)

Registry.create_feature_flag(
    ParamNames.END_CHAPTER_CELEBRATION,
    'This flag is for the end chapter celebration feature.',
    platform_parameter_domain.FeatureStages.PROD,
)

Registry.create_feature_flag(
    ParamNames.CHECKPOINT_CELEBRATION,
    'This flag is for the checkpoint celebration feature.',
    platform_parameter_domain.FeatureStages.PROD,
)

Registry.create_feature_flag(
    ParamNames.CONTRIBUTOR_DASHBOARD_ACCOMPLISHMENTS,
    'This flag enables showing per-contributor accomplishments on the' +
    ' contributor dashboard.',
    platform_parameter_domain.FeatureStages.PROD,
)

Registry.create_feature_flag(
    ParamNames.DIAGNOSTIC_TEST,
    'This flag is for the diagnostic test functionality.',
    platform_parameter_domain.FeatureStages.TEST)

Registry.create_feature_flag(
    ParamNames.SERIAL_CHAPTER_LAUNCH_CURRICULUM_ADMIN_VIEW,
    'This flag is for serial chapter launch feature and making changes only' +
    'in the curriculum admin view.',
    platform_parameter_domain.FeatureStages.TEST)

Registry.create_feature_flag(
    ParamNames.SERIAL_CHAPTER_LAUNCH_LEARNER_VIEW,
    'This flag is for serial chapter launch feature and making changes only' +
    'in the learner view.',
    platform_parameter_domain.FeatureStages.TEST)

Registry.create_feature_flag(
    ParamNames.SHOW_REDESIGNED_LEARNER_DASHBOARD,
    'This flag is to show redesigned learner dashboard.',
    platform_parameter_domain.FeatureStages.DEV)

Registry.create_feature_flag(
    ParamNames.SHOW_TRANSLATION_SIZE,
    'This flag is to show translation size on translation cards in' +
    'contributor dashboard.',
    platform_parameter_domain.FeatureStages.DEV)

Registry.create_feature_flag(
    ParamNames.SHOW_FEEDBACK_UPDATES_IN_PROFILE_PIC_DROPDOWN,
    'This flag is to show feedback updates in the' +
    'profile pic drop-down menu.',
     platform_parameter_domain.FeatureStages.DEV)

Registry.create_feature_flag(
    ParamNames.CD_ADMIN_DASHBOARD_NEW_UI,
    'This flag is to show new contributor admin dashboard.',
    platform_parameter_domain.FeatureStages.TEST)

Registry.create_feature_flag(
    ParamNames.IS_IMPROVEMENTS_TAB_ENABLED,
    'Exposes the Improvements Tab for creators in the exploration editor.',
    platform_parameter_domain.FeatureStages.PROD)

Registry.create_feature_flag(
    ParamNames.LEARNER_GROUPS_ARE_ENABLED,
    'Enable learner groups feature',
    platform_parameter_domain.FeatureStages.PROD)

Registry.create_feature_flag(
    ParamNames.NEW_LESSON_PLAYER,
    'This flag is to enable the exploration player redesign.',
    platform_parameter_domain.FeatureStages.DEV)

Registry.create_platform_parameter(
    ParamNames.PROMO_BAR_ENABLED,
    'Whether the promo bar should be enabled for all users',
    platform_parameter_domain.DataTypes.BOOL
)

Registry.create_platform_parameter(
    ParamNames.PROMO_BAR_MESSAGE,
    'The message to show to all users if the promo bar is enabled',
    platform_parameter_domain.DataTypes.STRING
)

Registry.create_platform_parameter(
    ParamNames.ALWAYS_ASK_LEARNERS_FOR_ANSWER_DETAILS,
    'Always ask learners for answer details. For testing -- do not use',
    platform_parameter_domain.DataTypes.BOOL
)

Registry.create_platform_parameter(
    ParamNames.MAX_NUMBER_OF_TAGS_ASSIGNED_TO_BLOG_POST,
    'The maximum number of tags that can be selected to categorize the blog '
    'post',
    platform_parameter_domain.DataTypes.NUMBER,
    default=10
)

Registry.create_platform_parameter(
    ParamNames.HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_CREATION_THRESHOLD,
    'The bounce-rate a state must exceed to create a new improvements task.',
    platform_parameter_domain.DataTypes.NUMBER,
    default=0.20
)

Registry.create_platform_parameter(
    ParamNames.HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_OBSOLETION_THRESHOLD,
    'The bounce-rate a state must fall under to discard its improvement task.',
    platform_parameter_domain.DataTypes.NUMBER,
    default=0.20
)

Registry.create_platform_parameter(
    ParamNames.HIGH_BOUNCE_RATE_TASK_MINIMUM_EXPLORATION_STARTS,
    'The minimum number of times an exploration is started before it can '
    'generate high bounce-rate improvements tasks.',
    platform_parameter_domain.DataTypes.NUMBER,
    default=100
)

Registry.create_platform_parameter(
    ParamNames.CONTRIBUTOR_DASHBOARD_REVIEWER_EMAILS_IS_ENABLED,
    'Enable sending Contributor Dashboard reviewers email notifications '
    'about suggestions that need review. The default value is false.',
    platform_parameter_domain.DataTypes.BOOL
)

Registry.create_platform_parameter(
    ParamNames.ENABLE_ADMIN_NOTIFICATIONS_FOR_SUGGESTIONS_NEEDING_REVIEW,
    (
        'Enable sending admins email notifications if there are Contributor '
        'Dashboard suggestions that have been waiting for a review for more '
        'than %s days. The default value is false.' % (
            suggestion_models.SUGGESTION_REVIEW_WAIT_TIME_THRESHOLD_IN_DAYS)
    ),
    platform_parameter_domain.DataTypes.BOOL
)

Registry.create_platform_parameter(
    ParamNames.ENABLE_ADMIN_NOTIFICATIONS_FOR_REVIEWER_SHORTAGE,
    (
        'Enable sending admins email notifications if Contributor Dashboard '
        'reviewers are needed in specific suggestion types. The default value '
        'is false.'
    ),
    platform_parameter_domain.DataTypes.BOOL
)

Registry.create_platform_parameter(
    ParamNames.MAX_NUMBER_OF_SUGGESTIONS_PER_REVIEWER,
    (
        'The maximum number of Contributor Dashboard suggestions per reviewer.'
        'If the number of suggestions per reviewer surpasses this maximum, '
        'for any given suggestion type on the dashboard, the admins are '
        'notified by email.'
    ),
    platform_parameter_domain.DataTypes.NUMBER,
    default=5
)

Registry.create_platform_parameter(
    ParamNames.RECORD_PLAYTHROUGH_PROBABILITY,
    'The probability of recording playthroughs',
    platform_parameter_domain.DataTypes.NUMBER,
    default=0.2
)
