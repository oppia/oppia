# coding: utf-8
#
# Copyright 2016 The Oppia Authors. All Rights Reserved.
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

from core.domain import acl_decorators
from core.domain import base
from core.domain import role_services
from core.tests import test_utils
import feconf


class AclDecoratorsTests(test_utils.GenericTestBase):

    published_exp_id = 'exp_id_1'
    private_exp_id = 'exp_id_2'

    def mock_fun(self, obj, act_id):
        return act_id

    def setUp(self):
        super(AclDecoratorsTests, self).setUp()

        self.save_new_valid_exploration(
            self.published_exp_id, self.get_user_id_from_email(self.OWNER_EMAIL))
        self.save_new_valid_exploration(
            self.private_exp_id, self.get_user_id_from_email(self.OWNER_EMAIL))


    def test_guest_can_access_public_exploration(self):

        class MockHandler(base.BaseHandler):
            @acl_decorators.play_exploration
            def get(self, activity_id):
                return self.render_json({'activity_id': activity_id})

        response = self.get_json(MockHandler)
        self.assertEqual(response, '')
        # self.assertEqual(obj.actions, '')
        # self.assertEqual(
        #     self.published_exp_id, acl_decorators.play_exploration(
        #         self.mock_fun)(obj, self.published_exp_id))
