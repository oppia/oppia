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

from core import platform_feature_list
from core.constants import constants
from core.domain import platform_parameter_domain
from core.domain import platform_parameter_registry as registry

from typing import Dict, List, Set

ALL_FEATURES_LIST: List[platform_feature_list.PARAM_NAMES] = (
    platform_feature_list.DEV_FEATURES_LIST +
    platform_feature_list.TEST_FEATURES_LIST +
    platform_feature_list.PROD_FEATURES_LIST
)

ALL_FEATURES_NAMES_SET: Set[str] = set(
    feature.value for feature in ALL_FEATURES_LIST
)


class FeatureFlagNotFoundException(Exception):
    """Exception thrown when an unknown feature flag is requested."""

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
            'server_mode': _get_server_mode()
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
        for _feature in ALL_FEATURES_LIST
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


def update_feature_flag_rules(
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

    registry.Registry.update_platform_parameter(
        feature_name, committer_id, commit_message, new_rules)


# TODO(#10211): Currently Oppia runs in either of the two modes:
# dev or prod. There should be another mode 'test' added for QA testing,
# once it is added, this function needs to be updated to take that into
# consideration.
def _get_server_mode() -> platform_parameter_domain.ServerMode:
    """Returns the running mode of Oppia.

    Returns:
        Enum(SERVER_MODES). The server mode of Oppia, dev if Oppia is running
        in development mode, prod if in production mode.
    """
    return (
        platform_parameter_domain.ServerMode.DEV
        if constants.DEV_MODE
        else platform_parameter_domain.ServerMode.PROD
    )


def _create_evaluation_context_for_server() -> (
    platform_parameter_domain.EvaluationContext
):
    """Returns evaluation context with information of the server.

    Returns:
        EvaluationContext. The context for evaluation.
    """
    # TODO(#11208): Here we use MyPy ignore because due to the missing
    # `browser_type` key MyPy throwing missing key error. Also, `app_version`
    # key is set as none which forces us to use `.get()` method while fetching
    # the values from dictionaries. So, to remove 'type ignore' from here and
    # '.get()' method from '.from_dict' method, properly set app version and
    # browser type key below using GAE app version as part of the server &
    # client context.
    return platform_parameter_domain.EvaluationContext.from_dict(
        {  # type: ignore[typeddict-item]
            'platform_type': 'Backend',
            'app_version': None,
        },
        {
            'server_mode': _get_server_mode()
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
        feature_name_value = param.evaluate(context)
        # Ruling out the possibility of any other type for mypy type checking.
        assert isinstance(feature_name_value, bool)
        result_dict[feature_name] = feature_name_value
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
