# Copyright 2019 The Oppia Authors. All Rights Reserved.
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

"""Controllers for fetching the features Oppia provides to its users."""

from __future__ import annotations

from core import feconf
from core.constants import constants
from core.controllers import acl_decorators
from core.controllers import base
from core.domain import config_domain

from typing import Dict


class ExplorationFeaturesHandler(
    base.BaseHandler[Dict[str, str], Dict[str, str]]
):
    """Returns features the given exploration is configured to support."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON
    URL_PATH_ARGS_SCHEMAS = {
        'exploration_id': {
            'schema': {
                'type': 'basestring',
                'validators': [{
                    'id': 'is_regex_matched',
                    'regex_pattern': constants.ENTITY_ID_REGEX
                }]
            }
        }
    }
    HANDLER_ARGS_SCHEMAS: Dict[str, Dict[str, str]] = {'GET': {}}

    @acl_decorators.can_play_exploration
    def get(self, exploration_id: str) -> None:
        """Handles GET requests for an exploration's features.

        Args:
            exploration_id: str. The ID of the exploration.
        """
        whitelisted_exploration_ids_for_playthroughs = (
            config_domain.WHITELISTED_EXPLORATION_IDS_FOR_PLAYTHROUGHS.value)
        self.render_json({
            'is_exploration_whitelisted':
                exploration_id in whitelisted_exploration_ids_for_playthroughs,
            'always_ask_learners_for_answer_details':
                config_domain.ALWAYS_ASK_LEARNERS_FOR_ANSWER_DETAILS.value
        })
