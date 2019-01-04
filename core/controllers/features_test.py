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

from core.domain import config_services
from core.domain import rights_services
from core.domain import user_services
from core.tests import test_utils
import feconf


class ExplorationPlaythroughRecordingFeatureTest(test_utils.GenericTestBase):

    ADMIN_EMAIL = 'admin@oppia.org'
    ADMIN_USERNAME = 'admin'
    EDITOR_EMAIL = 'editor@oppia.org'
    EDITOR_USERNAME = 'editor'

    WHITELISTED_EXP_ID = 'expId1'
    NON_WHITELISTED_EXP_ID = 'expId2'

    def setUp(self):
        super(ExplorationPlaythroughRecordingFeatureTest, self).setUp()

        # An editor signs up.
        self.signup(self.EDITOR_EMAIL, self.EDITOR_USERNAME)
        self.editor_id = self.get_user_id_from_email(self.EDITOR_EMAIL)
        self.editor = user_services.UserActionsInfo(self.editor_id)

        # The editor creates an exploration which will be whitelisted.
        self.save_new_valid_exploration(
            self.WHITELISTED_EXP_ID, self.editor_id,
            title='My First Exploration', end_state_name='END')
        rights_manager.publish_exploration(self.editor, self.WHITELISTED_EXP_ID)

        # The editor creates an exploration which will not be whitelisted.
        self.save_new_valid_exploration(
            self.NON_WHITELISTED_EXP_ID, self.editor_id,
            title='My Second Exploration', end_state_name='END')
        rights_manager.publish_exploration(
            self.editor, self.NON_WHITELISTED_EXP_ID)

        # An admin signs up.
        self.signup(self.ADMIN_EMAIL, self.ADMIN_USERNAME)
        self.admin_id = self.get_user_id_from_email(self.ADMIN_EMAIL)

        # The admin whitelists one of the editor's new explorations.
        config_services.set_property(
            self.admin_id, 'whitelisted_exploration_ids_for_playthroughs',
            [self.WHITELISTED_EXP_ID])

    def tearDown(self):
        config_services.revert_property(
            self.admin_id, 'whitelisted_exploration_ids_for_playthroughs')

        super(ExplorationPlaythroughRecordingFeatureTest, self).tearDown()

    def test_can_record_playthroughs_in_whitelisted_explorations(self):
        json_response = self.get_json(
            '/explrehandler/features/%s' % self.WHITELISTED_EXP_ID)
        self.assertTrue(json_response['is_playthrough_recording_enabled'])

    def test_can_not_record_playthroughs_in_non_whitelisted_explorations(self):
        json_response = self.get_json(
            '/explrehandler/features/%s' % self.NON_WHITELISTED_EXP_ID)
        self.assertFalse(json_response['is_playthrough_recording_enabled'])
