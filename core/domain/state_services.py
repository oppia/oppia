# coding: utf-8
#
# Copyright 2018 The Oppia Authors. All Rights Reserved.
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

"""Commands that can be used to operate on states"""
import logging

from core.domain import state_domain
import utils


def convert_state_dict_to_yaml(state_dict, width):
    """Converts the given state dict to yaml format.

    Args:
        state_dict: dict. A dict representing a state in an exploration.
        width: int. The maximum number of characters in a line for the
            returned YAML string.

    Returns:
        str. The YAML version of the state_dict.

    Raises:
        Exception: The state_dict does not represent a valid state.
    """
    try:
        # Check if the state_dict can be converted to a State.
        state = state_domain.State.from_dict(state_dict)
    except Exception:
        logging.info('Bad state dict: %s' % str(state_dict))
        raise Exception('Could not convert state dict to YAML.')

    return utils.yaml_from_dict(state.to_dict(), width=width)
