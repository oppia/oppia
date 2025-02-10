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

"""The service file for platform parameters."""

from __future__ import annotations

import copy
import json
import logging
import os

from core import feconf
from core import utils
from core.constants import constants
from core.domain import platform_parameter_domain
from core.domain import platform_parameter_list
from core.domain import platform_parameter_registry as registry

from typing import Dict, Final, List

DATA_TYPE_TO_SCHEMA_TYPE: Dict[str, str] = {
    'number': 'float',
    'string': 'unicode',
    'bool': 'bool'
}

PACKAGE_JSON_FILE_PATH: Final = os.path.join(os.getcwd(), 'package.json')


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


def get_all_platform_parameters_dicts() -> List[
    platform_parameter_domain.PlatformParameterDict
]:
    """Returns dict representations of all platform parameters. This method
    is used for providing detailed platform parameters information to the
    release-coordinator page.

    Returns:
        list(dict). A list containing the dict mappings of all fields of the
        platform parameters.
    """
    return [
        registry.Registry.get_platform_parameter(_plat_param.value).to_dict()
        for _plat_param in platform_parameter_list.ALL_PLATFORM_PARAMS_LIST
    ]


def get_server_mode() -> platform_parameter_domain.ServerMode:
    """Returns the running mode of Oppia.

    Returns:
        Enum(SERVER_MODES). The server mode of Oppia. This is "dev" if Oppia is
        running in development mode, "test" if Oppia is running in production
        mode but not on the main website, and "prod" if Oppia is running in
        full production mode on the main website.
    """
    # TODO(release-scripts#137): Remove once project ID is verified on all
    # servers.
    logging.info('Logging project ID for debugging: %s' % (
        os.environ['GOOGLE_CLOUD_PROJECT']))
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
    all_platform_params_dicts = get_all_platform_parameters_dicts()
    all_platform_params_names_set = set(
        param['name'] for param in all_platform_params_dicts)
    if parameter_name not in all_platform_params_names_set:
        raise PlatformParameterNotFoundException(
            'Unknown platform parameter: %s.' % parameter_name)

    context = _create_evaluation_context_for_server()
    param = registry.Registry.get_platform_parameter(parameter_name)
    return param.evaluate(context)


def get_platform_parameter_schema(param_name: str) -> Dict[str, str]:
    """Returns the schema for the platform parameter.

    Args:
        param_name: str. The name of the platform parameter.

    Returns:
        Dict[str, str]. The schema of the platform parameter according
        to the data_type.

    Raises:
        Exception. The platform parameter does not have valid data type.
    """
    parameter = registry.Registry.get_platform_parameter(param_name)
    if DATA_TYPE_TO_SCHEMA_TYPE.get(parameter.data_type) is not None:
        schema_type = copy.deepcopy(
            DATA_TYPE_TO_SCHEMA_TYPE[parameter.data_type])
        return {'type': schema_type}
    else:
        raise Exception(
            'The %s platform parameter has a data type of %s which is not '
            'valid. Please use one of these data types instead: %s.' % (
                parameter.name, parameter.data_type,
                platform_parameter_domain.PlatformDataTypes)
        )
