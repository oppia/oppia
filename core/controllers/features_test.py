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

"""Tests for fetching the features Oppia provides to its users."""

from core.domain import config_domain
from core.domain import rights_manager
from core.domain import user_services
from core.tests import test_utils
import feconf


def exploration_features_url(exp_id):
    """Builds URL for getting the features the given exploration supports."""
    return '%s/%s' % (feconf.EXPLORATION_FEATURES_PREFIX, exp_id)


class ExplorationFeaturesTestBase(test_utils.GenericTestBase):
    EXP_ID = 'expId1'

    def setUp(self):
        super(ExplorationFeaturesTestBase, self).setUp()

        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.save_new_valid_exploration(
            self.EXP_ID, editor_id, title='Explore!', end_state_name='END')
        editor_actions_info = user_services.UserActionsInfo(editor_id)
        rights_manager.publish_exploration(editor_actions_info, self.EXP_ID)

        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)


class ExplorationPlaythroughRecordingFeatureTest(ExplorationFeaturesTestBase):
    WHITELISTED_EXPLORATION_IDS_FOR_PLAYTHROUGHS = (
        config_domain.WHITELISTED_EXPLORATION_IDS_FOR_PLAYTHROUGHS.name)

    def test_can_record_playthroughs_in_whitelisted_explorations(self):
        exploration_in_whitelist_context = self.swap_property_value_context(
            self.admin_id, self.WHITELISTED_EXPLORATION_IDS_FOR_PLAYTHROUGHS,
            [self.EXP_ID])

        with exploration_in_whitelist_context:
            json_response = self.get_json(exploration_features_url(self.EXP_ID))

        self.assertTrue(json_response['is_playthrough_recording_enabled'])

    def test_can_not_record_playthroughs_in_non_whitelisted_explorations(self):
        nothing_in_whitelist_context = self.swap_property_value_context(
            self.admin_id, self.WHITELISTED_EXPLORATION_IDS_FOR_PLAYTHROUGHS,
            [])

        with nothing_in_whitelist_context:
            json_response = self.get_json(exploration_features_url(self.EXP_ID))

        self.assertFalse(json_response['is_playthrough_recording_enabled'])


class ExplorationImprovementsTabFeatureTest(ExplorationFeaturesTestBase):
    IS_IMPROVEMENTS_TAB_ENABLED = config_domain.IS_IMPROVEMENTS_TAB_ENABLED.name

    def test_improvements_tab_enabled(self):
        improvements_tab_is_enabled_context = self.swap_property_value_context(
            self.admin_id, self.IS_IMPROVEMENTS_TAB_ENABLED, True)

        with improvements_tab_is_enabled_context:
            json_response = self.get_json(exploration_features_url(self.EXP_ID))

        self.assertTrue(json_response['is_improvements_tab_enabled'])

    def test_improvements_tab_disabled(self):
        improvements_tab_is_disabled_context = self.swap_property_value_context(
            self.admin_id, self.IS_IMPROVEMENTS_TAB_ENABLED, False)

        with improvements_tab_is_disabled_context:
            json_response = self.get_json(exploration_features_url(self.EXP_ID))

        self.assertFalse(json_response['is_improvements_tab_enabled'])
