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

from core.controllers import acl_decorators
from core.controllers import base
from core.domain import config_domain
import feconf


class ExplorationFeaturesHandler(base.BaseHandler):
    """Returns features the given exploration is configured to support."""

    GET_HANDLER_ERROR_RETURN_TYPE = feconf.HANDLER_TYPE_JSON

    @acl_decorators.can_play_exploration
    def get(self, exploration_id):
        """Handles GET requests for an exploration's features.

        Args:
            exploration_id: str. The ID of the exploration.
        """
        whitelisted_exploration_ids_for_playthroughs = (
            config_domain.WHITELISTED_EXPLORATION_IDS_FOR_PLAYTHROUGHS.value)
        self.render_json({
            'is_improvements_tab_enabled':
                config_domain.IS_IMPROVEMENTS_TAB_ENABLED.value,
            'is_exploration_whitelisted':
                exploration_id in whitelisted_exploration_ids_for_playthroughs
        })
