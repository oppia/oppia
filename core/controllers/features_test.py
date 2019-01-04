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

"""Tests for the page that allows learners to play through an exploration."""

from core.domain import config_domain
from core.domain import config_services
from core.domain import rights_manager
from core.domain import user_services
from core.tests import test_utils


class ExplorationFeaturesTestBase(test_utils.GenericTestBase):

    ADMIN_EMAIL = 'admin@oppia.org'
    ADMIN_USERNAME = 'user1'
    EDITOR_EMAIL = 'editor@oppia.org'
    EDITOR_USERNAME = 'user2'

    def setUp(self):
        super(ExplorationFeaturesTestBase, self).setUp()
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)
        self.set_admins([self.ADMIN_USERNAME])

        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.editor = user_services.UserActionsInfo(self.editor_id)

    def swapped_property_context(self, name, value):
        return config_services.swapped_property_context(
            self.admin_id, name, value)

    def get_features(self, exp_id):
        return self.get_json('/explorehandler/features/%s' % exp_id)


class ExplorationPlaythroughRecordingFeatureTest(ExplorationFeaturesTestBase):

    EXP_ID = 'expId1'
    WHITELIST_CONFIG_PROPERTY_NAME = (
        config_domain.WHITELISTED_EXPLORATION_IDS_FOR_PLAYTHROUGHS.name)

    def setUp(self):
        super(ExplorationPlaythroughRecordingFeatureTest, self).setUp()
        self.save_new_valid_exploration(
            self.EXP_ID, self.editor_id, title='My Exploration',
            end_state_name='END')
        rights_manager.publish_exploration(self.editor, self.EXP_ID)

    def tearDown(self):
        config_services.revert_property(
            self.admin_id, self.WHITELIST_CONFIG_PROPERTY_NAME)
        super(ExplorationPlaythroughRecordingFeatureTest, self).tearDown()

    def test_can_record_playthroughs_in_whitelisted_explorations(self):
        # Add exploration id to the whitelist.
        with self.swapped_property_context(
                self.WHITELIST_CONFIG_PROPERTY_NAME, [self.EXP_ID]):
            json_response = self.get_features(self.EXP_ID)

        self.assertTrue(json_response['is_playthrough_recording_enabled'])

    def test_can_not_record_playthroughs_in_non_whitelisted_explorations(self):
        # Clear the whitelist
        with self.swapped_property_context(
                self.WHITELIST_CONFIG_PROPERTY_NAME, []):
            json_response = self.get_features(self.EXP_ID)

        self.assertFalse(json_response['is_playthrough_recording_enabled'])


class ExplorationImprovementsTabFeatureTest(ExplorationFeaturesTestBase):

    EXP_ID = 'exp1'
    IMPROVEMENTS_TAB_CONFIG_PROPERTY_NAME = (
        config_domain.IS_IMPROVEMENTS_TAB_ENABLED.name)

    def setUp(self):
        super(ExplorationImprovementsTabFeatureTest, self).setUp()
        self.save_new_valid_exploration(
            self.EXP_ID, self.editor_id, title='My Exploration',
            end_state_name='END')
        rights_manager.publish_exploration(self.editor, self.EXP_ID)

    def test_improvement_tab_enabled(self):
        with self.swapped_property_context(
                self.IMPROVEMENTS_TAB_CONFIG_PROPERTY_NAME, True):
            json_response = self.get_features(self.EXP_ID)

        self.assertTrue(
            json_response[self.IMPROVEMENTS_TAB_CONFIG_PROPERTY_NAME])

    def test_improvement_tab_disabled(self):
        with self.swapped_property_context(
                self.IMPROVEMENTS_TAB_CONFIG_PROPERTY_NAME, False):
            json_response = self.get_features(self.EXP_ID)

        self.assertFalse(
            json_response[self.IMPROVEMENTS_TAB_CONFIG_PROPERTY_NAME])
