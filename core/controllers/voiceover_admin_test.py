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

"""Tests for the exploration voice artist work."""

from __future__ import absolute_import  # pylint: disable=import-only-modules
from __future__ import unicode_literals  # pylint: disable=import-only-modules

import datetime

from core.domain import rights_domain
from core.domain import rights_manager
from core.domain import user_services
from core.platform import models
from core.tests import test_utils
import feconf


class testClass(test_utils.GenericTestBase):

    published_exp_id_1 = 'exp_1'
    published_exp_id_2 = 'exp_2'
    private_exp_id_1 = 'exp_3'
    private_exp_id_2 = 'exp_4'

    def setUp(self):
        """Completes the sign-up process for self.VOICE_ARTIST_EMAIL."""
        super(testClass, self).setUp()
        self.signup(self.OWNER_EMAIL, self.OWNER_USERNAME)
        self.signup(self.VOICE_ARTIST_EMAIL, self.VOICE_ARTIST_USERNAME)
        self.signup(self.VOICEOVER_ADMIN_EMAIL, self.VOICEOVER_ADMIN_USERNAME)

        self.owner_id = self.get_user_id_from_email(self.OWNER_EMAIL)
        self.voice_artist_id = self.get_user_id_from_email(
            self.VOICE_ARTIST_EMAIL)
        self.voiceover_admin_id = self.get_user_id_from_email(
            self.VOICEOVER_ADMIN_EMAIL)
        self.owner = user_services.get_user_actions_info(self.owner_id)
        self.save_new_valid_exploration(
            self.published_exp_id_1, self.owner_id)
        self.save_new_valid_exploration(
            self.published_exp_id_2, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id_1, self.owner_id)
        self.save_new_valid_exploration(
            self.private_exp_id_2, self.owner_id)
        rights_manager.publish_exploration(self.owner, self.published_exp_id_1)
        rights_manager.publish_exploration(self.owner, self.published_exp_id_2)
        user_services.update_user_role(
            self.voiceover_admin_id, feconf.ROLE_ID_VOICEOVER_ADMIN)

    def test_owner_cannot_assign_voiceartist(self):
        self.login(self.OWNER_EMAIL)
        params = {
            'username': self.VOICE_ARTIST_USERNAME
        }
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/voiceartist_management_handler/exploration/%s'
                % self.published_exp_id_1, params,
                csrf_token=csrf_token, expected_status_int=401)
        self.logout

    def test_voiceover_admin_can_assign_voiceartist(self):
        self.login(self.VOICEOVER_ADMIN_EMAIL)
        params = {
            'username': self.VOICE_ARTIST_USERNAME
        }
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/voiceartist_management_handler/exploration/%s'
                % self.published_exp_id_1, params, csrf_token=csrf_token)
        self.logout

    def test_voiceover_admin_can_deassign_voiceartist(self):
        self.login(self.VOICEOVER_ADMIN_EMAIL)
        params = {
            'username': self.VOICE_ARTIST_USERNAME
        }
        csrf_token = self.get_new_csrf_token()
        self.post_json(
            '/voiceartist_management_handler/exploration/%s'
                % self.published_exp_id_1, params, csrf_token=csrf_token)
        self.logout
