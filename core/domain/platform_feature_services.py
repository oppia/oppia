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

"""The service for gating features.

This service provides different interfaces to access the feature flag values
for clients and the backend respectively as they have different context for
evaluation of feature flag values.

For clients, please use 'evaluate_all_feature_flag_values_for_client' from
request handlers with client context.

For the backend, please directly call 'is_feature_enabled' with the name of
the feature.

For more details of the usage of these two methods, please refer their
docstrings in this file.
"""

from __future__ import annotations

import json
import os

from core import feconf
from core import platform_feature_list
from core import utils
from core.constants import constants
from core.domain import platform_parameter_domain
from core.domain import platform_parameter_list
from core.domain import platform_parameter_registry as registry

from typing import Dict, Final, List, Set

ALL_FEATURE_FLAGS: List[platform_feature_list.ParamNames] = (
    platform_feature_list.DEV_FEATURES_LIST +
    platform_feature_list.TEST_FEATURES_LIST +
    platform_feature_list.PROD_FEATURES_LIST
)

ALL_FEATURES_NAMES_SET: Set[str] = set(
    feature.value for feature in ALL_FEATURE_FLAGS
)

ALL_PLATFORM_PARAMS_EXCEPT_FEATURE_FLAGS: List[
    platform_parameter_list.ParamNames
] = [
        (
            platform_parameter_list.ParamNames.
            ALWAYS_ASK_LEARNERS_FOR_ANSWER_DETAILS
        ),
        platform_parameter_list.ParamNames.DUMMY_PARAMETER,
        (
            platform_parameter_list.ParamNames.
            HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_CREATION_THRESHOLD
        ),
        (
            platform_parameter_list.ParamNames.
            HIGH_BOUNCE_RATE_TASK_STATE_BOUNCE_RATE_OBSOLETION_THRESHOLD
        ),
        (
            platform_parameter_list.ParamNames.
            HIGH_BOUNCE_RATE_TASK_MINIMUM_EXPLORATION_STARTS
        ),
        platform_parameter_list.ParamNames.PROMO_BAR_ENABLED,
        platform_parameter_list.ParamNames.PROMO_BAR_MESSAGE,
    ]

PACKAGE_JSON_FILE_PATH: Final = os.path.join(os.getcwd(), 'package.json')


class FeatureFlagNotFoundException(Exception):
    """Exception thrown when an unknown feature flag is requested."""

    pass


class PlatformParameterNotFoundException(Exception):
    """Exception thrown when an unknown platform parameter is requested."""

    pass


def create_evaluation_context_for_client(
    client_context_dict: platform_parameter_domain.ClientSideContextDict
) -> platform_parameter_domain.EvaluationContext:
    """Returns context instance for evaluation, using the information
    provided by clients.

    Args:
        client_context_dict: dict. The client side context.

    Returns:
        EvaluationContext. The context for evaluation.
    """
    return platform_parameter_domain.EvaluationContext.from_dict(
        client_context_dict,
        {
            'server_mode': get_server_mode()
        }
    )


def get_all_feature_flag_dicts() -> List[
    platform_parameter_domain.PlatformParameterDict
]:
    """Returns dict representations of all feature flags. This method is used
    for providing detailed feature flags information to the admin panel.

    Returns:
        list(dict). A list containing the dict mappings of all fields of the
        feature flags.
    """
    return [
        registry.Registry.get_platform_parameter(_feature.value).to_dict()
        for _feature in ALL_FEATURE_FLAGS
    ]


def get_all_platform_parameters_except_feature_flag_dicts() -> List[
    platform_parameter_domain.PlatformParameterDict
]:
    """Returns dict representations of all platform parameters that do not
    contains feature flags. This method is used for providing detailed
    platform parameters information to the release-coordinator page.

    Returns:
        list(dict). A list containing the dict mappings of all fields of the
        platform parameters.
    """
    return [
        registry.Registry.get_platform_parameter(_plat_param.value).to_dict()
        for _plat_param in ALL_PLATFORM_PARAMS_EXCEPT_FEATURE_FLAGS
    ]


def evaluate_all_feature_flag_values_for_client(
    context: platform_parameter_domain.EvaluationContext
) -> Dict[str, bool]:
    """Evaluates and returns the values for all feature flags.

    Args:
        context: EvaluationContext. The context used for evaluation.

    Returns:
        dict. The keys are the feature names and the values are boolean
        results of corresponding flags.
    """
    return _evaluate_feature_flag_values_for_context(
        ALL_FEATURES_NAMES_SET, context)


def is_feature_enabled(feature_name: str) -> bool:
    """A short-form method for server-side usage. This method evaluates and
    returns the values of the feature flag, using context from the server only.

    Args:
        feature_name: str. The name of the feature flag that needs to
            be evaluated.

    Returns:
        bool. The value of the feature flag, True if it's enabled.
    """
    return _evaluate_feature_flag_value_for_server(feature_name)


def update_feature_flag(
    feature_name: str,
    committer_id: str,
    commit_message: str,
    new_rules: List[platform_parameter_domain.PlatformParameterRule]
) -> None:
    """Updates the feature flag's rules.

    Args:
        feature_name: str. The name of the feature to update.
        committer_id: str. ID of the committer.
        commit_message: str. The commit message.
        new_rules: list(PlatformParameterRule). A list of PlatformParameterRule
            objects to update.

    Raises:
        FeatureFlagNotFoundException. The feature_name is not registered in
            core/platform_feature_list.py.
    """
    if feature_name not in ALL_FEATURES_NAMES_SET:
        raise FeatureFlagNotFoundException(
            'Unknown feature flag: %s.' % feature_name)

    # The default value of a feature flag is always False and that
    # is why we are explicitly passing default_value as False.
    registry.Registry.update_platform_parameter(
        feature_name, committer_id, commit_message, new_rules, False)


def get_server_mode() -> platform_parameter_domain.ServerMode:
    """Returns the running mode of Oppia.

    Returns:
        Enum(SERVER_MODES). The server mode of Oppia. This is "dev" if Oppia is
        running in development mode, "test" if Oppia is running in production
        mode but not on the main website, and "prod" if Oppia is running in
        full production mode on the main website.
    """
    return (
        platform_parameter_domain.ServerMode.DEV
        if constants.DEV_MODE
        else platform_parameter_domain.ServerMode.PROD
        if feconf.ENV_IS_OPPIA_ORG_PRODUCTION_SERVER
        else platform_parameter_domain.ServerMode.TEST
    )


def _create_evaluation_context_for_server() -> (
    platform_parameter_domain.EvaluationContext
):
    """Returns evaluation context with information of the server.

    Returns:
        EvaluationContext. The context for evaluation.
    """
    current_app_version = json.load(utils.open_file(
        PACKAGE_JSON_FILE_PATH, 'r'))['version']
    # We want to make sure that the branch is the release branch.
    if not constants.BRANCH_NAME == '' and 'release' in constants.BRANCH_NAME:
        # We only need current app version so we can drop the 'release' part.
        current_app_version = constants.BRANCH_NAME.split('release-')[1]
        # We want to replace the '-' with the '.' for the version name.
        # If the branch is the hotfix branch then we would require to further
        # split it up and do the replacement for the version name. In the end,
        # '3-3-1-hotfix-5' will be '3.3.1-hotfix-5' and '3-3-1' will be '3.3.1'.
        if 'hotfix' in current_app_version:
            split_via_hotfix = current_app_version.split('-hotfix')
            current_app_version = (
                split_via_hotfix[0].replace('-', '.') +
                '-hotfix' + split_via_hotfix[1]
            )
        else:
            current_app_version = current_app_version.replace('-', '.')

    return platform_parameter_domain.EvaluationContext.from_dict(
        {
            'platform_type': 'Web',
            'app_version': current_app_version,
        },
        {
            'server_mode': get_server_mode()
        }
    )


def _evaluate_feature_flag_values_for_context(
    feature_names_set: Set[str],
    context: platform_parameter_domain.EvaluationContext
) -> Dict[str, bool]:
    """Evaluates and returns the values for specified feature flags.

    Args:
        feature_names_set: set(str). The set of names of feature flags that need
            to be evaluated.
        context: EvaluationContext. The context used for evaluation.

    Returns:
        dict. The keys are the feature names and the values are boolean
        results of corresponding flags.

    Raises:
        FeatureFlagNotFoundException. Some names in 'feature_names_set' are not
            registered in core/platform_feature_list.py.
    """
    unknown_feature_names = list(feature_names_set - ALL_FEATURES_NAMES_SET)
    if len(unknown_feature_names) > 0:
        raise FeatureFlagNotFoundException(
            'Unknown feature flag(s): %s.' % unknown_feature_names)

    result_dict = {}
    for feature_name in feature_names_set:
        param = registry.Registry.get_platform_parameter(
            feature_name)
        feature_is_enabled = param.evaluate(context)
        # Ruling out the possibility of any other type for mypy type checking.
        assert isinstance(feature_is_enabled, bool)
        result_dict[feature_name] = feature_is_enabled
    return result_dict


def _evaluate_feature_flag_value_for_server(feature_name: str) -> bool:
    """Evaluates and returns the values of the feature flag, using context
    from the server only.

    Args:
        feature_name: str. The name of the feature flag that needs to
            be evaluated.

    Returns:
        bool. The value of the feature flag, True if it's enabled.
    """
    context = _create_evaluation_context_for_server()
    values_dict = _evaluate_feature_flag_values_for_context(
        set([feature_name]), context)
    return values_dict[feature_name]


def get_platform_parameter_value(
    parameter_name: str) -> platform_parameter_domain.PlatformDataTypes:
    """Returns the value of the platform parameter.

    Args:
        parameter_name: str. The name of the platform parameter whose
            value is required.

    Returns:
        PlatformDataTypes. The value of the platform parameter.

    Raises:
        PlatformParameterNotFoundException. Platform parameter is not valid.
    """
    all_platform_params_dicts = (
        get_all_platform_parameters_except_feature_flag_dicts())
    all_platform_params_names_set = set(
        param['name'] for param in all_platform_params_dicts)
    if parameter_name not in all_platform_params_names_set:
        raise PlatformParameterNotFoundException(
            'Unknown platform parameter: %s.' % parameter_name)

    context = _create_evaluation_context_for_server()
    param = registry.Registry.get_platform_parameter(parameter_name)
    return param.evaluate(context)
